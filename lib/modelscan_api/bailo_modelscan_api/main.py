"""FastAPI app.
"""

from __future__ import annotations

from contextlib import nullcontext
import logging
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Annotated, Any

import uvicorn
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, UploadFile
from modelscan.modelscan import ModelScan

from bailo_modelscan_api.config import Settings
from bailo_modelscan_api.dependencies import safe_join

logger = logging.getLogger(__name__)


@lru_cache
def get_settings() -> Settings:
    """Fast way to only load settings from dotenv once.

    :return: Evaluated Settings from config file.
    """
    return Settings()


# Instantiate FastAPI app with various dependencies.
app = FastAPI(
    title=get_settings().app_name,
    summary=get_settings().app_summary,
    description=get_settings().app_description,
    version=get_settings().app_version,
    dependencies=[Depends(get_settings)],
)

# Instantiating ModelScan
modelscan = ModelScan(settings=get_settings().modelscan_settings)


@app.get(
    "/health",
    summary="Simple health check endpoint",
    description="Utility to check the operational status of the API.",
    status_code=HTTPStatus.OK,
    response_description='Always `{"status": "healthy"}`',
)
def health_check() -> dict[str, str]:
    """Minimal health check for the API endpoint.

    :return: always `{"status": "healthy"}`
    """
    return {"status": "healthy"}


@app.post(
    "/scan/file",
    summary="Upload and scan a file",
    description="Upload a file which is scanned by ModelScan and return the result of the scan",
    status_code=HTTPStatus.OK,
    response_description="The result from ModelScan",
)
def scan_file(
    in_file: UploadFile, background_tasks: BackgroundTasks, settings: Annotated[Settings, Depends(get_settings)]
) -> dict[str, Any]:
    """API endpoint to upload and scan a file using modelscan.

    :param in_file: uploaded file to be scanned
    :param background_tasks: FastAPI object to perform background tasks once the function has already returned.
    :raises HTTPException: failure to process the uploaded file in any way
    :return: `modelscan.scan` results
    """
    logger.info("Called the API endpoint to scan an uploaded file")
    try:
        # Use Setting's download_dir if defined else use a temporary directory.
        with TemporaryDirectory() if not settings.download_dir else nullcontext(settings.download_dir) as download_dir:
            if in_file.filename and str(in_file.filename).strip():
                # Prevent escaping to a parent dir
                try:
                    pathlib_path = safe_join(download_dir, in_file.filename)
                except ValueError:
                    logger.exception("Failed to safely join the filename to the path.")
                    raise HTTPException(
                        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                        detail="An error occurred while processing the uploaded file's name.",
                    )
            else:
                raise HTTPException(
                    status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                    detail="An error occurred while extracting the uploaded file's name.",
                )

            # Write the streamed in_file to disk.
            # This is a bit silly as modelscan will ultimately load this back into memory, but modelscan
            # doesn't currently support streaming.
            try:
                with open(pathlib_path, "wb") as out_file:
                    while content := in_file.file.read(settings.block_size):
                        out_file.write(content)
            except OSError as exception:
                logger.exception("Failed writing the file to the disk.")
                raise HTTPException(
                    status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                    detail=f"An error occurred while trying to write the uploaded file to the disk: {exception}",
                ) from exception

            # Scan the uploaded file.
            result = modelscan.scan(pathlib_path)

            # Finally, return the result.
            return result

    except HTTPException:
        # Re-raise HTTPExceptions.
        logger.exception("Re-raising HTTPException.")
        raise

    except Exception as exception:
        logger.exception("An unexpected error occurred.")
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {exception}",
        ) from exception

    finally:
        try:
            # Clean up the downloaded file as a background task to allow returning sooner.
            # If using a temporary dir then this would happen anyway, but if Settings' download_dir evaluates then this is required.
            logger.info("Cleaning up downloaded file.")
            background_tasks.add_task(Path.unlink, pathlib_path, missing_ok=True)
        except UnboundLocalError:
            # pathlib_path may not exist.
            logger.exception("An error occurred while trying to cleanup the downloaded file.")


if __name__ == "__main__":
    logger.info("Starting the application programmatically.")
    uvicorn.run(app)
