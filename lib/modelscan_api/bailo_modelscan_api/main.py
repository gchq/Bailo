"""FastAPI app.
"""

from email.message import Message
from functools import lru_cache
from http import HTTPStatus
from pathlib import Path

from bailo import Client
from bailo.core.exceptions import BailoException
from fastapi import BackgroundTasks, FastAPI, HTTPException
from modelscan.modelscan import ModelScan
from requests import Response
import uvicorn

from bailo_modelscan_api.dependencies import ResponsePath, parse_path
from bailo_modelscan_api.config import Settings


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
    try:
        return bailo_client.get_download_file(model_id, file_id)
    except BailoException as exception:
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
    pathlib_path = parse_path(path)

    res = get_file(model_id, file_id)
    if not res.ok:
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
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while extracting the downloaded file's name.",
        )

    try:
        # Write the streamed response to disk.
        # This is a bit silly as modelscan will ultimately load this back into memory, but modelscan doesn't currently support streaming.
        with open(pathlib_path, "wb") as f:
            for data in res.iter_content(get_settings().block_size):
                f.write(data)
    except OSError as exception:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while trying to write the downloaded file to the disk: {exception}\n{type(exception)}",
        )

    return ResponsePath(res, pathlib_path)


# TODO: don't keep this, but it is useful for testing things work
@app.get("/")
async def read_root():
    return {"message": "Hello world!"}


# TODO: define return schema
@app.get("/scan/{model_id}/{file_id}")
def scan(model_id: str, file_id: str, background_tasks: BackgroundTasks):
    """Scan the specific file for a given model.

    :param model_id: Unique model ID
    :param file_id: Unique file ID
    :param background_tasks: FastAPI object to perform background tasks once the function has already returned.
    :return: The model_id, file_id, and results object from modelscan.
    """
    try:
        # Ideally we would just get this and pass the streamed response to modelscan, but currently modelscan only reads from files rather than in-memory objects.
        file_response = download_file(model_id, file_id, get_settings().download_dir)
        # No need to check the responses's status_code as download_file already does this.

        # Scan the downloaded file.
        result = modelscan.scan(file_response.path)

        # Finally, return the result.
        return {"model_id": model_id, "file_id": file_id, "result": result}
    except HTTPException:
        # Re-raise HTTPExceptions.
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {exception}",
        )
    finally:
        try:
            # Clean up the downloaded file as a background task to allow returning sooner.
            background_tasks.add_task(Path.unlink, file_response.path, missing_ok=True)
        except:
            # file_response may not be defined if download_file failed.
            pass


if __name__ == "__main__":
    # Start the app programmatically.
    uvicorn.run(app)
