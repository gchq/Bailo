"""FastAPI app to provide a ArtefactScan REST API."""

from __future__ import annotations

import logging
import shutil
from contextlib import asynccontextmanager
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path
from pickletools import genops
from tempfile import NamedTemporaryFile
from typing import Annotated, Any

import modelscan
import uvicorn
from content_size_limit_asgi import ContentSizeLimitMiddleware
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, UploadFile
from modelscan.modelscan import ModelScan
from pydantic import BaseModel

# isort: split

from bailo_artefactscan_api import trivy
from bailo_artefactscan_api.config import Settings
from bailo_artefactscan_api.openapi.scan_file_responses import SCAN_FILE_RESPONSES
from bailo_artefactscan_api.openapi.scan_image_responses import SCAN_IMAGE_RESPONSES

logger = logging.getLogger("uvicorn.error")


@lru_cache
def get_settings() -> Settings:
    """Fast way to only load settings from dotenv once.

    :return: Evaluated Settings from config file.
    """
    return Settings()


class CustomMiddlewareHTTPExceptionWrapper(HTTPException):
    """Wrapper of HTTPException to make ContentSizeLimitMiddleware raise HTTPException status_code 413 which FastAPI can capture and return."""

    def __init__(self, detail):
        super().__init__(status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE.value, detail=detail)


@asynccontextmanager
async def lifespan(app: FastAPI):
    trivy.download_database()
    yield

    logger.info("Cleaning up database")
    shutil.rmtree(trivy.get_settings().DB_DIR)


# Instantiate FastAPI app with various dependencies.
app = FastAPI(
    title=get_settings().app_name,
    summary=get_settings().app_summary,
    description=get_settings().app_description,
    version=get_settings().app_version,
    dependencies=[Depends(get_settings)],
    lifespan=lifespan,
)
# Limit the maximum filesize
app.add_middleware(
    ContentSizeLimitMiddleware,
    max_content_size=get_settings().maximum_filesize,
    exception_cls=CustomMiddlewareHTTPExceptionWrapper,
)


class ApiInformation(BaseModel):
    """Minimal typed information about the API endpoint.

    :param BaseModel: Pydantic super class
    """

    apiName: str
    apiVersion: str
    modelscanScannerName: str
    modelscanVersion: str
    trivyScannerName: str
    trivyVersion: str


@app.get(
    "/info",
    summary="Simple information endpoint",
    description="Utility to get the key information about the API.",
    status_code=HTTPStatus.OK.value,
    response_description="A populated ApiInformation object",
)
async def info(settings: Annotated[Settings, Depends(get_settings)]) -> ApiInformation:
    """Information about the API.

    :return: a JSON representable object with keys from ApiInformation
    """
    return ApiInformation(
        apiName=settings.app_name,
        apiVersion=settings.app_version,
        modelscanScannerName=modelscan.__name__,
        modelscanVersion=modelscan.__version__,
        trivyScannerName=trivy.__name__.split(".")[-1],
        trivyVersion=trivy.get_trivy_version(),
    )


@app.post(
    "/scan/file",
    summary="Upload and scan a file with modelscan",
    description="Upload a file which is scanned by ModelScan and returns the result of the scan",
    status_code=HTTPStatus.OK.value,
    response_description="The result from ModelScan",
    response_model=dict[str, Any],
    responses=SCAN_FILE_RESPONSES,
)
def scan_file(
    in_file: UploadFile,
    background_tasks: BackgroundTasks,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """API endpoint to upload and scan a file using modelscan.

    :param in_file: uploaded file to be scanned
    :param background_tasks: FastAPI object to perform background tasks once the function has already returned.
    :raises HTTPException: failure to process the uploaded file in any way
    :return: `modelscan.scan` results
    """
    logger.info("Called the API endpoint to scan uploaded file %s", in_file.filename)
    try:
        # Instantiate ModelScan
        modelscan_model = ModelScan(settings=settings.modelscan_settings)

        file_suffix = Path(str(in_file.filename).strip()).suffix
        with NamedTemporaryFile("wb", suffix=file_suffix, delete=False) as out_file:
            file_path = Path(out_file.name)
            logger.debug("Writing file %s to disk as %s", in_file.filename, file_path)
            # Write the streamed in_file to disk.
            # This is a bit silly as modelscan will ultimately load this back into memory, but modelscan
            # doesn't currently support streaming directly from memory.
            try:
                while content := in_file.file.read(settings.block_size):
                    out_file.write(content)
            except OSError as exception:
                logger.exception("Failed to write file %s to disk as %s", in_file.filename, file_path)
                raise HTTPException(
                    status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
                    detail=f"An error occurred while trying to write the uploaded file to the disk: {exception}",
                ) from exception

        if (
            settings.modelscan_settings["scanners"]["modelscan.scanners.PickleUnsafeOpScan"]["enabled"]
            and file_path.suffix
            in settings.modelscan_settings["scanners"]["modelscan.scanners.PickleUnsafeOpScan"]["supported_extensions"]
            and not is_valid_pickle(file_path)
        ):
            # false positive e.g. "license.dat"
            new_file_path = file_path.with_suffix(".txt")
            logger.info(
                "File %s is not a pickle but extension is in the ModelScan config `scanners.PickleUnsafeOpScan.supported_extensions` "
                "file extensions. Renaming from %s to %s",
                in_file.filename,
                file_path,
                new_file_path,
            )
            file_path = file_path.rename(new_file_path)

        # Scan the uploaded file.
        logger.info("Initiating ModelScan scan of %s (%s)", file_path, in_file.filename)
        result = modelscan_model.scan(file_path)
        logger.info("ModelScan result for %s (%s): %s", file_path, in_file.filename, result)

        # Finally, return the result.
        return result

    except HTTPException:
        # Re-raise HTTPExceptions.
        logger.exception("Re-raising HTTPException.")
        raise

    except Exception as exception:
        logger.exception("An unexpected error occurred.")
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"An error occurred: {exception}",
        ) from exception

    finally:
        try:
            # Clean up the downloaded file as a background task to allow returning sooner.
            # The OS should handle this anyway, but it's safer to be explicit.
            logger.info("Cleaning up downloaded file %s (for %s)", file_path, in_file.filename)
            background_tasks.add_task(Path.unlink, file_path, missing_ok=True)
        except UnboundLocalError:
            # file_path may not be defined.
            logger.exception("An error occurred while trying to cleanup the downloaded file.")


@app.post("/scan/image", responses=SCAN_IMAGE_RESPONSES)
def scan_image(
    in_file: UploadFile,
    background_tasks: BackgroundTasks,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """API endpoint to upload and scan image blobs using trivy.

    Blobs have to be compressed tarballs with an overlay file system

    """
    logger.info("Upload started")
    res = trivy.scan(in_file, background_tasks, settings.block_size)
    return res


def is_valid_pickle(file_path: Path, max_bytes: int = 2 * 1024 * 1024) -> bool:
    """Safely checks if a given file is a valid Pickle file.

    :param file_path: file path to be scanned
    :param max_bytes: maximum number of bytes to read in, defaults to 2*1024*1024
    :return: whether the read bytes are a Pickle file (or not)
    """
    with open(file_path, "rb") as f:
        data = f.read(max_bytes)

    if not data:
        return False

    try:
        # Attempt to iterate through all opcodes
        for _ in genops(data):
            pass
        return True
    except ValueError:
        return False


if __name__ == "__main__":
    logger.info("Starting the application programmatically.")
    uvicorn.run(app)
