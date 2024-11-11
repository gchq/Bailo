"""FastAPI app.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path
from typing import Any

import uvicorn
from bailo_modelscan_api.config import Settings
from bailo_modelscan_api.dependencies import parse_path
from fastapi import BackgroundTasks, FastAPI, HTTPException, UploadFile
from modelscan.modelscan import ModelScan


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
)

# Instantiating ModelScan
modelscan = ModelScan(settings=get_settings().modelscan_settings)


@app.post(
    "/scan/file",
    summary="Upload and scan a file",
    description="Upload a file which is scanned by ModelScan and return the result",
    status_code=HTTPStatus.OK,
    response_description="The result from ModelScan",
)
def scan_file(in_file: UploadFile, background_tasks: BackgroundTasks) -> dict[str, Any]:
    """API endpoint to upload and scan a file using modelscan.

    :param in_file: uploaded file to be scanned
    :param background_tasks: FastAPI object to perform background tasks once the function has already returned.
    :raises HTTPException: failure to process the uploaded file in any way
    :return: `modelscan.scan` results
    """
    logger.info("Called the API endpoint to scan an uploaded file")
    try:
        if in_file.filename:
            pathlib_path = Path.joinpath(parse_path(get_settings().download_dir), str(in_file.filename))
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
                while content := in_file.file.read(get_settings().block_size):
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
            logger.info("Cleaning up downloaded file.")
            background_tasks.add_task(Path.unlink, pathlib_path, missing_ok=True)
        except Exception:
            logger.exception("An error occurred while trying to cleanup the downloaded file.")


if __name__ == "__main__":
    logger.info("Starting the application programmatically.")
    uvicorn.run(app)
