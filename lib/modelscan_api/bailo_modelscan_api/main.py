"""FastAPI app to provide a ModelScan REST API."""

from __future__ import annotations

import logging
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

from bailo_modelscan_api.config import Settings

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


# Instantiate FastAPI app with various dependencies.
app = FastAPI(
    title=get_settings().app_name,
    summary=get_settings().app_summary,
    description=get_settings().app_description,
    version=get_settings().app_version,
    dependencies=[Depends(get_settings)],
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
    scannerName: str
    modelscanVersion: str


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
        scannerName=modelscan.__name__,
        modelscanVersion=modelscan.__version__,
    )


@app.post(
    "/scan/file",
    summary="Upload and scan a file",
    description="Upload a file which is scanned by ModelScan and return the result of the scan",
    status_code=HTTPStatus.OK.value,
    response_description="The result from ModelScan",
    response_model=dict[str, Any],
    # Example response generated from https://github.com/protectai/modelscan/blob/main/notebooks/keras_fashion_mnist.ipynb
    responses={
        HTTPStatus.OK.value: {
            "description": "modelscan returned results",
            "content": {
                "application/json": {
                    "examples": {
                        "Normal": {
                            "value": {
                                "summary": {
                                    "total_issues_by_severity": {
                                        "LOW": 0,
                                        "MEDIUM": 0,
                                        "HIGH": 0,
                                        "CRITICAL": 0,
                                    },
                                    "total_issues": 0,
                                    "input_path": "/foo/bar/safe_model.pkl",
                                    "absolute_path": "/foo/bar",
                                    "modelscan_version": "0.8.1",
                                    "timestamp": "2024-11-19T12:00:00.000000",
                                    "scanned": {
                                        "total_scanned": 1,
                                        "scanned_files": ["safe_model.pkl"],
                                    },
                                    "skipped": {
                                        "total_skipped": 0,
                                        "skipped_files": [],
                                    },
                                },
                                "issues": [],
                                "errors": [],
                            }
                        },
                        "Issue": {
                            "value": {
                                "summary": {
                                    "total_issues_by_severity": {
                                        "LOW": 0,
                                        "MEDIUM": 1,
                                        "HIGH": 0,
                                        "CRITICAL": 0,
                                    },
                                    "total_issues": 1,
                                    "input_path": "/foo/bar/unsafe_model.h5",
                                    "absolute_path": "/foo/bar",
                                    "modelscan_version": "0.8.1",
                                    "timestamp": "2024-11-19T12:00:00.000000",
                                    "scanned": {
                                        "total_scanned": 1,
                                        "scanned_files": ["unsafe_model.h5"],
                                    },
                                    "skipped": {
                                        "total_skipped": 0,
                                        "skipped_files": [],
                                    },
                                },
                                "issues": [
                                    {
                                        "description": "Use of unsafe operator 'Lambda' from module 'Keras'",
                                        "operator": "Lambda",
                                        "module": "Keras",
                                        "source": "unsafe_model.h5",
                                        "scanner": "modelscan.scanners.H5LambdaDetectScan",
                                        "severity": "MEDIUM",
                                    }
                                ],
                                "errors": [],
                            }
                        },
                        "Skipped": {
                            "value": {
                                "errors": [],
                                "issues": [],
                                "summary": {
                                    "input_path": "/foo/bar/empty.txt",
                                    "absolute_path": "/foo/bar",
                                    "modelscan_version": "0.8.1",
                                    "scanned": {"total_scanned": 0},
                                    "skipped": {
                                        "skipped_files": [
                                            {
                                                "category": "SCAN_NOT_SUPPORTED",
                                                "description": "Model Scan did not scan file",
                                                "source": "empty.txt",
                                            }
                                        ],
                                        "total_skipped": 1,
                                    },
                                    "timestamp": "2024-11-19T12:00:00.000000",
                                    "total_issues": 0,
                                    "total_issues_by_severity": {
                                        "CRITICAL": 0,
                                        "HIGH": 0,
                                        "LOW": 0,
                                        "MEDIUM": 0,
                                    },
                                },
                            }
                        },
                        "Error": {
                            "value": {
                                "summary": {
                                    "total_issues_by_severity": {
                                        "LOW": 0,
                                        "MEDIUM": 0,
                                        "HIGH": 0,
                                        "CRITICAL": 0,
                                    },
                                    "total_issues": 0,
                                    "input_path": "/foo/bar/null.h5",
                                    "absolute_path": "/foo/bar",
                                    "modelscan_version": "0.8.1",
                                    "timestamp": "2024-11-19T12:00:00.000000",
                                    "scanned": {"total_scanned": 0},
                                    "skipped": {
                                        "total_skipped": 1,
                                        "skipped_files": [
                                            {
                                                "category": "SCAN_NOT_SUPPORTED",
                                                "description": "Model Scan did not scan file",
                                                "source": "null.h5",
                                            }
                                        ],
                                    },
                                },
                                "issues": [],
                                "errors": [
                                    {
                                        "category": "MODEL_SCAN",
                                        "description": "Unable to synchronously open file (file signature not found)",
                                        "source": "null.h5",
                                    }
                                ],
                            }
                        },
                    }
                }
            },
        },
        HTTPStatus.INTERNAL_SERVER_ERROR.value: {
            "description": "The server could not complete the request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "The following error was raised during a pytorch scan:\nInvalid magic number for file: /tmp/tmpzlugzlrh.pt"
                    }
                }
            },
        },
    },
)
async def scan_file(
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
