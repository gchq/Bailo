import os
from unittest.mock import Mock, patch

import pytest
import requests
import requests_pkcs12

from bailoclient.client.http import RequestsAdapter
from bailoclient.client.auth import NullAuthenticator


MINIMAL_MODEL_PATH = os.getenv("MINIMAL_MODEL_PATH")


@pytest.fixture
def response_mock():
    return Mock(spec=requests.Response)


@pytest.fixture
def requests_mock():
    return Mock(spec=requests)


@pytest.fixture
def mock_auth_headers():
    return {"header": "value"}


@pytest.fixture
def auth_mock(mock_auth_headers):
    class MockAuth(NullAuthenticator):
        """Mock to test adding auth headers"""

        def get_authorisation_headers(self):
            return mock_auth_headers

    return MockAuth()


@pytest.fixture
def api_mock(null_bailo_config, auth_mock):
    api = RequestsAdapter(null_bailo_config)
    api._requests_module = Mock(spec=requests)
    api._auth = auth_mock
    return api


@pytest.fixture
def pki_api_mock(pki_bailo_config, auth_mock):
    api = RequestsAdapter(pki_bailo_config)
    api._requests_module = Mock(spec=requests_pkcs12)
    api._auth = auth_mock
    return api


@patch("bailoclient.client.http.RequestsAdapter._connect")
def test_cognito_uses_requests_module(patch_connect, cognito_bailo_config):
    api = RequestsAdapter(cognito_bailo_config)
    assert api._requests_module == requests


def test_pki_uses_requests_pkcs12_module(pki_bailo_config):
    api = RequestsAdapter(pki_bailo_config)
    assert api._requests_module == requests_pkcs12


def test_null_uses_requests_module(null_bailo_config):
    api = RequestsAdapter(null_bailo_config)
    assert api._requests_module == requests


def test_get_request_with_response(
    api_mock, response_mock, mock_auth_headers, null_bailo_config
):
    response_mock.json.return_value = {"response": "success"}
    response_mock.status_code = 200
    api_mock._requests_module.get.return_value = response_mock

    api_mock.get("/test/url")
    api_mock._requests_module.get.assert_called_once_with(
        f"{null_bailo_config.bailo_url}/test/url",
        headers=mock_auth_headers,
        params=None,
        timeout=null_bailo_config.timeout_period,
        verify=null_bailo_config.ca_verify,
    )


def test_get_pki_request_with_response(
    pki_api_mock, response_mock, mock_auth_headers, pki_bailo_config
):
    response_mock.json.return_value = {"response": "success"}
    response_mock.status_code = 201
    pki_api_mock._requests_module.get.return_value = response_mock

    pki_api_mock.get("/test/url")
    pki_api_mock._requests_module.get.assert_called_once_with(
        f"{pki_bailo_config.bailo_url}/test/url",
        pkcs12_filename=pki_bailo_config.auth.pkcs12_filename,
        pkcs12_password=pki_bailo_config.auth.pkcs12_password,
        headers=mock_auth_headers,
        params=None,
        timeout=pki_bailo_config.timeout_period,
        verify=pki_bailo_config.ca_verify,
    )


def test_get_downloads_file_to_output_dir(
    temp_dir, api_mock, null_bailo_config, response_mock, mock_auth_headers
):
    with open(f"{MINIMAL_MODEL_PATH}/minimal_binary.zip", "rb") as zipfile:
        content = zipfile.read()

    response_mock.json.return_value = {"response": "success"}
    response_mock.status_code = 200
    response_mock.content = content
    api_mock._requests_module.get.return_value = response_mock

    api_mock.get("/test/url", output_dir=temp_dir)
    api_mock._requests_module.get.assert_called_once_with(
        f"{null_bailo_config.bailo_url}/test/url",
        headers=mock_auth_headers,
        params=None,
        timeout=null_bailo_config.timeout_period,
        verify=null_bailo_config.ca_verify,
    )
    assert os.listdir(temp_dir) == ["model.bin"]


def test_post_request_with_response(
    api_mock, response_mock, mock_auth_headers, pki_bailo_config
):
    response_mock.json.return_value = {"response": "success"}
    response_mock.status_code = 201
    api_mock._requests_module.post.return_value = response_mock

    request_body = {"data": "value"}
    api_mock.post("/test/url", request_body=request_body)
    api_mock._requests_module.post.assert_called_once_with(
        f"{pki_bailo_config.bailo_url}/test/url",
        data=request_body,
        headers=mock_auth_headers,
        params=None,
        timeout=pki_bailo_config.timeout_period,
        verify=pki_bailo_config.ca_verify,
    )


def test_put_request_with_response(
    api_mock, response_mock, mock_auth_headers, pki_bailo_config
):
    response_mock.json.return_value = {"response": "success"}
    response_mock.status_code = 201
    api_mock._requests_module.put.return_value = response_mock

    request_body = {"data": "value"}
    api_mock.put("/test/url", request_body=request_body)
    api_mock._requests_module.put.assert_called_once_with(
        f"{pki_bailo_config.bailo_url}/test/url",
        data=request_body,
        headers=mock_auth_headers,
        params=None,
        timeout=pki_bailo_config.timeout_period,
        verify=pki_bailo_config.ca_verify,
    )


def test_post_pki_request_with_response(
    pki_api_mock, response_mock, mock_auth_headers, pki_bailo_config
):
    response_mock.json.return_value = {"response": "success"}
    response_mock.status_code = 201
    pki_api_mock._requests_module.post.return_value = response_mock

    request_body = {"data": "value"}
    pki_api_mock.post("/test/url", request_body=request_body)
    pki_api_mock._requests_module.post.assert_called_once_with(
        f"{pki_bailo_config.bailo_url}/test/url",
        pkcs12_filename=pki_bailo_config.auth.pkcs12_filename,
        pkcs12_password=pki_bailo_config.auth.pkcs12_password,
        data=request_body,
        headers=mock_auth_headers,
        params=None,
        timeout=pki_bailo_config.timeout_period,
        verify=pki_bailo_config.ca_verify,
    )


def test_put_pki_request_with_response(
    pki_api_mock, response_mock, mock_auth_headers, pki_bailo_config
):
    response_mock.json.return_value = {"response": "success"}
    response_mock.status_code = 201
    pki_api_mock._requests_module.put.return_value = response_mock

    request_body = {"data": "value"}
    pki_api_mock.put("/test/url", request_body=request_body)
    pki_api_mock._requests_module.put.assert_called_once_with(
        f"{pki_bailo_config.bailo_url}/test/url",
        pkcs12_filename=pki_bailo_config.auth.pkcs12_filename,
        pkcs12_password=pki_bailo_config.auth.pkcs12_password,
        data=request_body,
        headers=mock_auth_headers,
        params=None,
        timeout=pki_bailo_config.timeout_period,
        verify=pki_bailo_config.ca_verify,
    )
