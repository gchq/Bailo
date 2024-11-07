from email.message import Message
from functools import lru_cache
from pathlib import Path

from bailo import Client
from fastapi import BackgroundTasks, FastAPI
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
    return bailo_client.get_download_file(model_id, file_id)


def download_file(model_id: str, file_id: str, path: str | None = None) -> ResponsePath:
    """Get and download a specific file by its id.

    :param model_id: Unique model ID
    :param file_id: Unique file ID
    :param path: _description_
    :return: The unique file ID
    """
    pathlib_path = parse_path(path)

    # TODO: try/catch as bailo_client may be bad (e.g. auth errors)
    res = get_file(model_id, file_id)
    if not res.ok:
        # TODO: properly error
        raise Exception

    if (content_disposition := res.headers.get("Content-Disposition")) is not None:
        # parse to get filename
        msg = Message()
        msg["content-disposition"] = content_disposition
        if (filename := msg.get_filename()) is not None:
            pathlib_path = Path.joinpath(pathlib_path, str(filename))
    # TODO: else fail

    with open(pathlib_path, "wb") as f:
        for data in res.iter_content(get_settings().block_size):
            f.write(data)

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
    # Make sure that we have the file that is being checked
    # Ideally we would just get this abd pass the streamed response to modelscan, but currently modelscan only reads from files rather than in-memory objects
    file_response = download_file(model_id, file_id)
    if not file_response.response.ok:
        # TODO: error properly
        return file_response

    # Scan the downloaded file.
    try:
        result = modelscan.scan(file_response.path)
        # TODO: catch and handle errors
    finally:
        # Clean up the downloaded file as a background task to allow returning sooner.
        background_tasks.add_task(Path.unlink, file_response.path, missing_ok=True)
    # Finally, return the result.
    return {"model_id": model_id, "file_id": file_id, "result": result}


if __name__ == "__main__":
    # Start the app programmatically.
    uvicorn.run(app)
