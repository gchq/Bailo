import os
import re
from unittest.mock import MagicMock, patch

import pytest
from glob import glob
from bailoclient.config import APIConfig, BailoConfig, Pkcs12Config
from json import JSONDecodeError

from ..bailoclient.api import AuthorisedAPI
from ..bailoclient.auth import NullAuthenticator, Pkcs12Authenticator
from ..bailoclient.utils.exceptions import (
    NoServerResponseMessage,
    UnauthorizedException,
)

MINIMAL_MODEL_PATH = os.getenv("MINIMAL_MODEL_PATH")


@pytest.fixture
def authorised_api():

    api_config = APIConfig(url=os.environ["BAILO_URL"], ca_verify=False)

    config = BailoConfig(api=api_config)

    auth = NullAuthenticator(config)
    auth.get_authorisation_headers = MagicMock(return_value={"header": "value"})

    api = AuthorisedAPI(config, auth)

    return api


@pytest.fixture
def pki_authorised_api():

    api_config = APIConfig(url=os.environ["BAILO_URL"], ca_verify=False)

    pki_config = Pkcs12Config(pkcs12_filename="filename", pkcs12_password="password")
    config = BailoConfig(api=api_config, pki=pki_config)

    auth = Pkcs12Authenticator(config)

    api = AuthorisedAPI(config, auth)

    return api


def test_form_url_prepends_slash(authorised_api):
    url = "this/is/a/url"
    formed_url = authorised_api._form_url(url)

    assert formed_url == f"{os.environ['BAILO_URL']}/{url}"


def test_form_url_does_not_prepend_slash(authorised_api):
    url = "/this/is/a/url"
    formed_url = authorised_api._form_url(url)

    assert formed_url == f"{os.environ['BAILO_URL']}{url}"


def test_get_headers_returns_merged_headers_if_input_headers_provided(authorised_api):
    headers = authorised_api._get_headers({"new_header": "value2"})

    assert headers == {"header": "value", "new_header": "value2"}


def test_get_headers_returns_auth_headers(authorised_api):
    assert authorised_api._get_headers() == {"header": "value"}


class MockResponse:
    def __init__(self, response_json, status_code, content_required=False):
        self.response_json = response_json
        self.status_code = status_code

        if content_required:
            with open(f"{MINIMAL_MODEL_PATH}/minimal_binary.zip", "rb") as zipfile:
                content = zipfile.read()

            self.content = content

    def json(self):
        if not self.response_json:
            raise JSONDecodeError("msg", "doc", 1)

        return self.response_json

    def raise_for_status(self):
        if not self.response_json:
            raise NoServerResponseMessage(f"Server returned {self.status_code}")


def test_get_returns_response_json_if_successful(authorised_api):
    response = authorised_api._handle_response(
        MockResponse({"response": "success"}, 201)
    )
    assert response == {"response": "success"}


def test_handle_response_raises_unauthorised_exception_if_401_error_and_response_json(
    authorised_api,
):
    with pytest.raises(UnauthorizedException):
        authorised_api._handle_response(MockResponse({"response": "failure"}, 401))


def test_handle_response_raises_for_status_if_no_response_json(authorised_api):
    with pytest.raises(NoServerResponseMessage, match=re.escape("Server returned 401")):
        authorised_api._handle_response(MockResponse(None, 401))


@patch.object(AuthorisedAPI, "_AuthorisedAPI__decode_file_content")
def test_handle_response_calls_decode_file_content_if_an_output_dir_is_provided(
    mock_decode_file_content, authorised_api, tmpdir
):
    authorised_api._handle_response(
        MockResponse({"result": "success"}, 200, content_required=True),
        output_dir=tmpdir,
    )

    mock_decode_file_content.assert_called_once()


@patch(
    "bailoclient.api.requests.get",
    return_value=MockResponse({"result": "success"}, 200),
)
def test_get_calls_requests_get_if_not_pki_auth(mock_get, authorised_api):

    authorised_api.get("/test/url")

    mock_get.assert_called_once_with(
        f"{os.environ['BAILO_URL']}/test/url",
        headers=authorised_api._get_headers(),
        params=None,
        timeout=authorised_api.timeout_period,
        verify=authorised_api.verify_certificates,
    )


@patch(
    "bailoclient.api.requests.post",
    return_value=MockResponse({"result": "success"}, 200),
)
def test_post_calls_requests_get_if_not_pki_auth(mock_post, authorised_api):
    request_body = {"data": "value"}

    authorised_api.post("/test/url", request_body=request_body)

    mock_post.assert_called_once_with(
        f"{os.environ['BAILO_URL']}/test/url",
        data=request_body,
        headers=authorised_api._get_headers(),
        params=None,
        timeout=authorised_api.timeout_period,
        verify=authorised_api.verify_certificates,
    )


@patch(
    "bailoclient.api.requests.put",
    return_value=MockResponse({"result": "success"}, 200),
)
def test_put_calls_requests_get_if_not_pki_auth(mock_put, authorised_api):
    request_body = {"data": "value"}

    authorised_api.put("/test/url", request_body=request_body)

    mock_put.assert_called_once_with(
        f"{os.environ['BAILO_URL']}/test/url",
        data=request_body,
        headers=authorised_api._get_headers(),
        params=None,
        timeout=authorised_api.timeout_period,
        verify=authorised_api.verify_certificates,
    )


@patch(
    "bailoclient.api.requests_pkcs12.get",
    return_value=MockResponse({"result": "success"}, 200),
)
def test_get_calls_pkcs12_requests_get_if_pki_auth(mock_get, pki_authorised_api):
    request_body = {"data": "value"}

    pki_authorised_api.get("/test/url")

    mock_get.assert_called_once_with(
        f"{os.environ['BAILO_URL']}/test/url",
        pkcs12_filename="filename",
        pkcs12_password="password",
        headers=pki_authorised_api._get_headers(),
        params=None,
        timeout=pki_authorised_api.timeout_period,
        verify=pki_authorised_api.verify_certificates,
    )


@patch(
    "bailoclient.api.requests_pkcs12.get",
    return_value=MockResponse({"result": "success"}, 200),
)
def test_post_calls_pkcs12_requests_get_if_pki_auth(mock_get, pki_authorised_api):
    request_body = {"data": "value"}

    pki_authorised_api.post("/test/url", request_body=request_body)

    mock_get.assert_called_once_with(
        f"{os.environ['BAILO_URL']}/test/url",
        pkcs12_filename="filename",
        pkcs12_password="password",
        data=request_body,
        headers=pki_authorised_api._get_headers(),
        params=None,
        timeout=pki_authorised_api.timeout_period,
        verify=pki_authorised_api.verify_certificates,
    )


@patch(
    "bailoclient.api.requests_pkcs12.get",
    return_value=MockResponse({"result": "success"}, 200),
)
def test_put_calls_pkcs12_requests_get_if_pki_auth(mock_get, pki_authorised_api):
    request_body = {"data": "value"}

    pki_authorised_api.put("/test/url", request_body=request_body)

    mock_get.assert_called_once_with(
        f"{os.environ['BAILO_URL']}/test/url",
        pkcs12_filename="filename",
        pkcs12_password="password",
        data=request_body,
        headers=pki_authorised_api._get_headers(),
        params=None,
        timeout=pki_authorised_api.timeout_period,
        verify=pki_authorised_api.verify_certificates,
    )


def test_decode_file_content_downloads_file_to_output_dir_from_byte_stream(
    authorised_api, tmpdir
):
    with open(f"{MINIMAL_MODEL_PATH}/minimal_binary.zip", "rb") as zipfile:
        data = zipfile.read()

    authorised_api._AuthorisedAPI__decode_file_content(data, tmpdir)

    assert glob(f"{tmpdir}/model.bin")
