"""Utilities for use in the client module"""

from json import JSONDecodeError
from typing import Dict, Optional
import io
import os
import shutil
import zipfile

from requests.models import Response

from bailoclient.utils.exceptions import UnauthorizedException
from bailoclient.client.auth import AuthenticationInterface


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


def handle_response(response: Response, output_dir: str = None):
    """Handle the response from the server

    Args:
        response: Response from the server
        output_dir: Directory to download any files to

    Raises:
        UnauthorizedException: Unathorised to access server

    Returns:
        str: Response status or message
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
