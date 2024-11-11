"""FastAPI app.
"""

from __future__ import annotations

import logging
from email.message import Message
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path

import uvicorn
from bailo import Client
from bailo.core.exceptions import BailoException
from bailo_modelscan_api.config import Settings
from bailo_modelscan_api.dependencies import ResponsePath, parse_path
from fastapi import BackgroundTasks, FastAPI, HTTPException
from modelscan.modelscan import ModelScan
from requests import Response

logger = logging.getLogger(__name__)

# Instantiate FastAPI app with various dependencies.
app = FastAPI()


@lru_cache
def get_settings() -> Settings:
    """Fast way to only load settings from dotenv once.

    :return: Evaluated Settings from config file.
    """
    return Settings()


# Instantiating the PkiAgent(), if using.
# agent = PkiAgent(cert='', key='', auth='')

# Instantiating the Bailo client
bailo_client = Client(get_settings().bailo_client_url)

# Instantiating ModelScan
modelscan = ModelScan(settings=get_settings().modelscan_settings)


def get_file(model_id: str, file_id: str) -> Response:
    """Get a specific file by its id.

    :param model_id: Unique model ID
    :param file_id: Unique file ID
    :return: The unique file ID
    """
    logger.info("Fetching specified file from the bailo client.")
    try:
        return bailo_client.get_download_file(model_id, file_id)
    except BailoException as exception:
        logger.exception("Failed to get the specified file from the bailo client.")
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while trying to connect to the Bailo client: {exception}",
        )


def download_file(model_id: str, file_id: str, path: str | None = None) -> ResponsePath:
    """Get and download a specific file by its id.

    :param model_id: Unique model ID
    :param file_id: Unique file ID
    :param path: The directory to write the downloaded file to
    :return: The unique file ID
    """
    logger.info("Downloading file from bailo client.")
    pathlib_path = parse_path(path)

    res = get_file(model_id, file_id)
    if not res.ok:
        logger.exception('The bailo client did not return an "ok" response.')
        raise HTTPException(status_code=res.status_code, detail=res.text)

    try:
        # Parse to get the filename (we mainly care about the file's extension as modelscan uses that).
        content_disposition = res.headers["Content-Disposition"]
        msg = Message()
        msg["content-disposition"] = content_disposition
        # None and empty strings both evaluate to false.
        if filename := msg.get_filename():
            pathlib_path = Path.joinpath(pathlib_path, str(filename))
        else:
            raise ValueError("Cannot have an empty filename")
    except (ValueError, KeyError) as exception:
        logger.exception("Failed to extract key information.")
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while extracting the downloaded file's name.",
        )

    try:
        # Write the streamed response to disk.
        # This is a bit silly as modelscan will ultimately load this back into memory, but modelscan
        # doesn't currently support streaming.
        with open(pathlib_path, "wb") as f:
            for data in res.iter_content(get_settings().block_size):
                f.write(data)
    except OSError as exception:
        logger.exception("Failed writing the file to the disk.")
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while trying to write the downloaded file to the disk: {exception}\n{type(exception)}",
        )

    return ResponsePath(res, pathlib_path)


# TODO: define return schema
@app.get("/scan/{model_id}/{file_id}")
def scan(model_id: str, file_id: str, background_tasks: BackgroundTasks):
    """Scan the specific file for a given model.

    :param model_id: Unique model ID
    :param file_id: Unique file ID
    :param background_tasks: FastAPI object to perform background tasks once the function has already returned.
    :return: The model_id, file_id, and results object from modelscan.
    """
    logger.info("Called the API endpoint to scan a specific file")
    try:
        # Ideally we would just get this and pass the streamed response to modelscan, but currently modelscan
        # only reads from files rather than in-memory objects.
        file_response = download_file(model_id, file_id, get_settings().download_dir)
        # No need to check the responses's status_code as download_file already does this.

        # Scan the downloaded file.
        result = modelscan.scan(file_response.path)

        # Finally, return the result.
        return {"model_id": model_id, "file_id": file_id, "result": result}
    except HTTPException:
        # Re-raise HTTPExceptions.
        logger.exception("Re-raising HTTPException.")
        raise
    except Exception as exception:
        logger.exception("An unexpected error occurred.")
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {exception}",
        )
    finally:
        try:
            # Clean up the downloaded file as a background task to allow returning sooner.
            logger.info("Cleaning up downloaded file.")
            background_tasks.add_task(Path.unlink, file_response.path, missing_ok=True)
        except Exception:
            # file_response may not be defined if download_file failed.
            pass


if __name__ == "__main__":
    logger.info("Starting the application programmatically.")
    uvicorn.run(app)
