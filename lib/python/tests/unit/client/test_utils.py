import os
import re
from json import JSONDecodeError

import pytest

from bailoclient.client.utils import (
    form_url,
    get_headers,
    handle_response,
    _add_files_to_payload,
)
from bailoclient.exceptions import (
    NoServerResponseMessage,
    UnauthorizedException,
)

from bailoclient.client.utils import get_file_name, get_mime_type

MINIMAL_MODEL_PATH = os.getenv("MINIMAL_MODEL_PATH")


def test_form_url_prepends_slash(bailo_url):
    path = "this/is/a/url"
    assert form_url(bailo_url, path) == f"{bailo_url}/{path}"


def test_form_url_does_not_prepend_slash(bailo_url):
    path = "/this/is/a/url"
    assert form_url(bailo_url, path) == f"{bailo_url}{path}"


def test_get_headers_returns_merged_headers_if_input_headers_provided(mock_auth):
    headers = get_headers(mock_auth, {"new_header": "value2"})
    assert headers == {"header": "value", "new_header": "value2"}


def test_get_headers_returns_auth_headers(mock_auth):
    assert get_headers(mock_auth) == {"header": "value"}


def test_get_returns_response_json_if_successful(mock_response):
    mock_response.json.return_value = {"response": "success"}
    mock_response.status_code = 201
    assert handle_response(mock_response) == {"response": "success"}


def test_handle_response_raises_unauthorised_exception_if_401_error_and_response_json(
    mock_response,
):
    mock_response.json.return_value = {"response": "failure"}
    mock_response.status_code = 401
    with pytest.raises(UnauthorizedException):
        handle_response(mock_response)


def test_handle_response_raises_for_status_if_no_response_json(mock_response):
    mock_response.json.side_effect = JSONDecodeError("msg", "doc", 1)
    mock_response.raise_for_status.side_effect = NoServerResponseMessage(
        f"Server returned 401"
    )
    mock_response.status_code = 401
    with pytest.raises(NoServerResponseMessage, match=re.escape("Server returned 401")):
        handle_response(mock_response)


def test_handle_response_calls_decode_file_content_if_an_output_dir_is_provided(
    mock_response, temp_dir
):
    with open(f"{MINIMAL_MODEL_PATH}/minimal_binary.zip", "rb") as zipfile:
        content = zipfile.read()

    mock_response.json.return_value = {"response": "success"}
    mock_response.status_code = 200
    mock_response.content = content

    handle_response(mock_response, output_dir=temp_dir)
    assert os.listdir(temp_dir) == ["model.bin"]


def test_get_file_name_of_file_correctly():
    assert "responses.json" == get_file_name("tests/data/responses.json")


def test_get_file_name_of_dir_correctly():
    assert "data" == get_file_name("data")


def test_get_mime_type_json():
    assert "application/json" == get_mime_type("tests/data/responses.json")


def test_get_mime_type_json_file_does_not_exist():
    assert "application/json" == get_mime_type("path/does/not/exist/responses.json")


def test_get_mime_type_dir_is_none():
    assert get_mime_type("tests/data") is None


def test_add_files_to_payload_adds_code_and_binary_files():
    payloads = []
    _add_files_to_payload(
        payloads=payloads,
        binary_file="../../frontend/cypress/fixtures/minimal_binary.zip",
        code_file="../../frontend/cypress/fixtures/minimal_code.zip",
    )

    assert len(payloads) == 2
    assert "code" in payloads[0]
    assert "binary" in payloads[1]
    assert "minimal_code.zip" in payloads[0][1]
    assert "minimal_binary.zip" in payloads[1][1]


def test_generate_payload():
    pass
