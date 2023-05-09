"""Utility functions for use in the client module"""

import mimetypes
from functools import wraps
from json import JSONDecodeError
from typing import Dict, Optional, Callable, Union, List
import io
import logging
import os
import shutil
import zipfile

from requests.models import Response
from requests_toolbelt import MultipartEncoder

from bailoclient.exceptions import UnauthorizedException, UnconnectedClient
from bailoclient.client.auth import AuthenticationInterface

logger = logging.getLogger(__name__)


def get_headers(
    auth: AuthenticationInterface, input_headers: Optional[Dict] = None
) -> Dict[str, str]:
    """
    Merge request and auth headers into single dict for making a request

    Args:
        auth: Auth instance to generate any needed authheaders
        input_headers: Non auth request headers

    Returnds:
        Dict: merged headers
    """
    if input_headers:
        input_headers.update(auth.get_authorisation_headers())
        return input_headers
    return auth.get_authorisation_headers()


def form_url(base_url, request_path: str) -> str:
    """Combine the bailo base_url with the path to a resource

    Args:
        base_url: url of the bailo instance
        request_path: path of the resource a request is being made to

    Returns:
        str: combined resource url
    """
    if request_path.startswith("/"):
        return f"{base_url}{request_path}"

    return f"{base_url}/{request_path}"


def _decode_file_content(content: bytes, output_dir: str):
    """Decode zipfile bytes from HttpResponse into model files

    Args:
        content: Content from the API response
        output_dir: The directory to save the zip file to
    """
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        archive.extractall(output_dir)

    if os.path.exists(f"{output_dir}/__MACOSX"):
        shutil.rmtree(f"{output_dir}/__MACOSX")


def get_file_name(path: str):
    """Get the filename from a path

    Args:
        path: path to the file to get name of

    Returns:
        str: name of the file
    """
    return os.path.basename(path)


def get_mime_type(path: str) -> str:
    """Get the mimetype of a file

    Args:
        path: path to file to get the mime type of

    Returns:
        str: mime type of the file
    """
    return mimetypes.guess_type(path)[0]


def generate_payload(
    metadata: dict, binary_file: str, code_file: str
) -> MultipartEncoder:
    """Generate payload for posting model or deployment

    Args:
        metadata: Model metadata
        binary_file: Path to model binary file
        code_file: Path to model code file

    Returns:
        MultipartEncoder: Payload of model data
    """
    payloads = [("metadata", metadata)]
    payloads = _add_files_to_payload(payloads, binary_file, code_file)

    return MultipartEncoder(payloads)


def _add_files_to_payload(payloads: List, binary_file: str, code_file: str) -> List:
    """Add code and binary files to the payload

    Args:
        payloads: List of payloads
        binary_file: File path of binary
        code_file: File path of code
    """
    for tag, full_filename in zip(["code", "binary"], [code_file, binary_file]):
        f_name = get_file_name(full_filename)
        mtype = get_mime_type(full_filename)
        with open(full_filename, "rb") as file:
            payloads.append((tag, (f_name, file.read(), mtype)))

    return payloads


def handle_reconnect(func: Callable) -> Callable:
    """Reconnect the Client

    Args:
        func: Client function

    Raises:
        UnconnectedClient: Client has not previously been connected

    Returns:
        Callable: Function to handle reconnecting
    """

    @wraps(func)
    def reconnect(*args, **kwargs):
        self = args[0]
        try:
            return func(*args, **kwargs)

        except UnauthorizedException as exc:
            logger.debug("Not currently connected to Bailo")

            if self.connection_params:
                logger.debug("Reconnecting")
                self._auth.authenticate_user()
                return func(*args, **kwargs)

            logger.error("Client has not previously connected")
            raise UnconnectedClient("Client must call connect to authenticate") from exc

    return reconnect


def handle_response(
    response: Response, output_dir: str = None
) -> Optional[Union[str, Dict]]:
    """Handle the response from the server

    Args:
        response: Response from the server
        output_dir: Directory to download any files to

    Raises:
        UnauthorizedException: Unathorised to access server

    Returns:
        Union[str, dict, None]: Response status or message
    """

    if 200 <= response.status_code < 300:
        if output_dir:
            _decode_file_content(response.content, output_dir)
            return response.status_code

        return response.json()

    if response.status_code == 401:
        try:
            data = response.json()
            raise UnauthorizedException(data)
        except JSONDecodeError:
            response.raise_for_status()

    try:
        data = response.json()
        return data

    except:
        response.raise_for_status()
