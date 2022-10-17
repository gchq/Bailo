from re import L
from unittest import TestCase
from unittest.mock import patch, Mock
from bailoclient.bailo import Bailo
from bailoclient.utils.exceptions import (
    IncompleteDotEnvFile,
    MissingDotEnvFile,
    UnableToCreateBailoClient,
)
import pytest
import os

from bailoclient.config import APIConfig, BailoConfig
from tests.mocks.mock_api import MockAPI
from tests.mocks.mock_auth import MockAuthentication
from bailoclient.client import Client

import logging

BAILO_URL = os.environ["BAILO_URL"]


@pytest.fixture()
@patch("bailoclient.bailo.load_dotenv", return_value=True)
@patch("bailoclient.bailo.Bailo._Bailo__create_client_from_env")
def bailo_client(mock_create_client, mock_load_dotenv):
    return Bailo()


@patch("bailoclient.bailo.load_dotenv", return_value=False)
def test_bailo_raises_error_if_env_file_not_found(mock_load_dotenv):
    with pytest.raises(MissingDotEnvFile):
        bailo = Bailo()


def test_bailo_raises_error_if_some_cognito_config_is_missing():
    with pytest.raises(UnableToCreateBailoClient):
        bailo = Bailo(cognito_user_pool_id="id")


def test_bailo_raises_error_if_some_pki_config_is_missing():
    with pytest.raises(UnableToCreateBailoClient):
        bailo = Bailo(pki_p12="path", bailo_url="localhost")


@patch("bailoclient.bailo.load_dotenv")
def test_create_client_from_env_raises_error_if_unable_to_find_complete_cognito_or_pki_config(
    mock_load_dotenv, bailo_client
):
    with pytest.raises(IncompleteDotEnvFile):
        bailo_client._Bailo__create_client_from_env()


@patch("bailoclient.bailo.Bailo.cognito_client")
def test_create_client_creates_cognito_client_if_properties_exist(
    mock_cognito_client, bailo_client
):
    cognito_properties = (
        "user_pool_id",
        "client_id",
        "client_secret",
        "region",
        "url",
        "username",
        "pwd",
    )
    bailo_client._Bailo__get_cognito_auth_properties = Mock(
        return_value=cognito_properties
    )

    bailo_client._Bailo__create_client_from_env()

    mock_cognito_client.assert_called_once_with(*cognito_properties)


@patch("bailoclient.bailo.Bailo.pki_client")
@patch(
    "bailoclient.bailo.Bailo._Bailo__get_cognito_auth_properties", side_effect=KeyError
)
def test_create_client_creates_pki_if_cognito_success_false_and_pki_properties_exist(
    mock_get_cognito_properties, mock_pki_client, bailo_client
):
    pki_properties = ("p12", "ca", "url")
    bailo_client._Bailo__get_pki_auth_properties = Mock(return_value=pki_properties)

    bailo_client._Bailo__create_client_from_env()

    bailo_client._Bailo__get_pki_auth_properties.assert_called_once()
    mock_pki_client.assert_called_once_with(*pki_properties)


@patch("bailoclient.bailo.Bailo.cognito_client")
@patch("bailoclient.bailo.Bailo._Bailo__get_pki_auth_properties")
def test_create_client_skips_pki_if_cognito_client_success(
    mock_get_pki_properties, mock_cognito_client, bailo_client
):
    cognito_properties = (
        "user_pool_id",
        "client_id",
        "client_secret",
        "region",
        "url",
        "username",
        "pwd",
    )
    bailo_client._Bailo__get_cognito_auth_properties = Mock(
        return_value=cognito_properties
    )

    bailo_client._Bailo__create_client_from_env()

    mock_get_pki_properties.assert_not_called()


@patch.dict(
    os.environ,
    {
        "COGNITO_USERPOOL": "id",
        "COGNITO_CLIENT_ID": "client_id",
        "COGNITO_CLIENT_SECRET": "client_secret",
        "COGNITO_REGION": "region",
        "BAILO_URL": "url",
        "COGNITO_USERNAME": "username",
        "COGNITO_PASSWORD": "password",
    },
)
def test_get_cognito_auth_properties_extracts_required_cognito_properties_from_env(
    bailo_client,
):
    result = bailo_client._Bailo__get_cognito_auth_properties()

    assert result == (
        "id",
        "client_id",
        "client_secret",
        "region",
        "url",
        "username",
        "password",
    )


def test_get_cognito_auth_properties_raises_error_if_unable_to_find_properties_in_env(
    bailo_client,
):
    with pytest.raises(KeyError):
        bailo_client._Bailo__get_cognito_auth_properties()


@patch.dict(
    os.environ,
    {"P12_FILE": "file/path", "CA_FILE": "ca/file/path", "BAILO_URL": "bailo_url"},
)
def test_get_pki_auth_properties_extracts_required_cognito_properties_from_env(
    bailo_client,
):
    result = bailo_client._Bailo__get_pki_auth_properties()

    assert result == ("file/path", "ca/file/path", "bailo_url")


def test_get_pki_auth_properties_raises_error_if_unable_to_find_properties_in_env(
    bailo_client,
):
    with pytest.raises(KeyError):
        bailo_client._Bailo__get_pki_auth_properties()


@pytest.fixture()
def mock_client():
    config = BailoConfig(
        api=APIConfig(url=BAILO_URL, ca_verify=True),
    )
    auth = MockAuthentication()
    api = MockAPI(config, auth, "tests/resources/responses/responses.json")
    return Client(config, authenticator=auth, api=api)


@patch("bailoclient.client.Client.connect")
def test_cognito_client_creates_connected_client(
    mock_client_connect, mock_client, bailo_client
):
    bailo_client.create_cognito_client = Mock(return_value=mock_client)
    bailo_client.create_cognito_client("id", "id", "secret", "region", "url")

    bailo_client.cognito_client(
        "pool_id", "client_id", "secret", "region", "url", "username", "password"
    )

    bailo_client.create_cognito_client.assert_called_once()
    mock_client.connect.assert_called_once()


@patch("bailoclient.bailo.getpass.getpass", return_value="pwd")
@patch("bailoclient.client.Client.connect")
def test_pki_client_creates_connected_client(
    mock_client_connect, mock_get_pass, mock_client, bailo_client
):
    bailo_client.create_pki_client = Mock(return_value=mock_client)
    bailo_client.create_pki_client("p12/file", "ca/file", "url")

    bailo_client.pki_client("p12/file", "ca/file", "url")

    bailo_client.create_pki_client.assert_called_once()
    mock_client.connect.assert_called_once()


class TestLogging(TestCase):
    @pytest.fixture(autouse=True)
    def prepare_fixture(self, bailo_client):
        self.bailo_client = bailo_client

    def test_cognito_logs(self):
        print(os.environ)
        with self.assertLogs("bailoclient.bailo", level="INFO") as cm:
            with pytest.raises(KeyError):
                self.bailo_client._Bailo__get_cognito_auth_properties()
            self.assertEqual(
                cm.output,
                [
                    "INFO:bailoclient.bailo:Unable to find required environment variables for Cognito authentication: 'COGNITO_USERPOOL' not found"
                ],
            )

    def test_pki_logs(self):
        with self.assertLogs("bailoclient.bailo", level="INFO") as cm:
            with pytest.raises(KeyError):
                self.bailo_client._Bailo__get_pki_auth_properties()
            self.assertEqual(
                cm.output,
                [
                    "INFO:bailoclient.bailo:Unable to find required environment variables for PKI authentication: 'P12_FILE' not found"
                ],
            )
