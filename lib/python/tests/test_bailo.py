from unittest import TestCase
from unittest.mock import MagicMock, patch, Mock
from bailoclient.auth import CognitoSRPAuthenticator, Pkcs12Authenticator
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

BAILO_URL = os.environ["BAILO_URL"]


@pytest.fixture()
def mock_client():
    config = BailoConfig(
        api=APIConfig(url=BAILO_URL, ca_verify=True),
    )
    auth = MockAuthentication()
    api = MockAPI(config, auth, "tests/resources/responses/responses.json")
    return Client(config, authenticator=auth, api=api)


@pytest.fixture()
@patch("bailoclient.bailo.load_dotenv", return_value=True)
@patch("bailoclient.bailo.Bailo._Bailo__create_client_from_env")
def bailo_client(mock_create_client, mock_load_dotenv):
    config = BailoConfig(
        api=APIConfig(url=BAILO_URL, ca_verify=True),
    )
    auth = MockAuthentication()

    mock_create_client.return_value = config, auth

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


@patch("bailoclient.bailo.Bailo.cognito_client", return_value=("auth", "config"))
def test_create_client_creates_cognito_client_if_properties_exist(
    mock_cognito_client, bailo_client
):
    cognito_properties = (
        "user_pool_id",
        "client_id",
        "client_secret",
        "region",
        "url",
    )
    bailo_client._Bailo__get_cognito_auth_properties = Mock(
        return_value=(*cognito_properties, "username", "password")
    )

    bailo_client._Bailo__create_client_from_env()

    mock_cognito_client.assert_called_once_with(*cognito_properties)


@patch("bailoclient.bailo.Bailo.pki_client", return_value=("auth", "config"))
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


@patch("bailoclient.bailo.Bailo.cognito_client", return_value=("one", "two"))
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
        "BAILO_URL": os.environ["BAILO_URL"],
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
        os.environ["BAILO_URL"],
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
    {
        "P12_FILE": "file/path",
        "CA_FILE": "ca/file/path",
        "BAILO_URL": os.environ["BAILO_URL"],
    },
)
def test_get_pki_auth_properties_extracts_required_cognito_properties_from_env(
    bailo_client,
):
    result = bailo_client._Bailo__get_pki_auth_properties()

    assert result == ("file/path", "ca/file/path", os.environ["BAILO_URL"])


def test_get_pki_auth_properties_raises_error_if_unable_to_find_properties_in_env(
    bailo_client,
):
    with pytest.raises(KeyError):
        bailo_client._Bailo__get_pki_auth_properties()


def test_cognito_client_creates_config_for_authentication(bailo_client):
    config, auth = bailo_client.cognito_client(
        "pool_id", "client_id", "secret", "region", os.environ["BAILO_URL"]
    )

    assert isinstance(config, BailoConfig)
    assert auth == CognitoSRPAuthenticator


@patch("bailoclient.bailo.load_dotenv", return_value=True)
@patch(
    "bailoclient.bailo.Bailo._Bailo__create_client_from_env",
    return_value=("config", "auth", ("username", "pwd")),
)
@patch("bailoclient.bailo.Client.__init__")
@patch("bailoclient.bailo.Client.connect")
def test_bailo_calls_super_init_if_auth_config_found(
    mock_client_connect, mock_client_init, mock_create_client_env, mock_load_dotenv
):
    bailo = Bailo()

    mock_client_init.assert_called_once_with("config", "auth")


@patch("bailoclient.bailo.load_dotenv", return_value=True)
@patch("bailoclient.bailo.Client.__init__")
def test_bailo_raises_error_if_not_all_config_provided_for_auth(
    mock_client_init, mock_load_dotenv
):
    with pytest.raises(UnableToCreateBailoClient):
        bailo = Bailo(cognito_client_id="id")


@patch.dict(
    os.environ,
    {
        "COGNITO_USERPOOL": "id",
        "COGNITO_CLIENT_ID": "client_id",
        "COGNITO_CLIENT_SECRET": "client_secret",
        "COGNITO_REGION": "region",
        "BAILO_URL": os.environ["BAILO_URL"],
        "COGNITO_USERNAME": "username",
        "COGNITO_PASSWORD": "password",
    },
)
@patch("bailoclient.bailo.load_dotenv", return_value=True)
@patch("bailoclient.bailo.Client.__init__")
@patch("bailoclient.bailo.Client.connect")
def test_bailo_calls_connect_with_username_and_password_if_cognito_auth(
    mock_client_connect,
    mock_client_init,
    mock_load_dotenv,
):
    bailo = Bailo()

    mock_client_connect.assert_called_once_with(
        username="username", password="password"
    )


@patch.dict(
    os.environ,
    {
        "P12_FILE": "file/path",
        "CA_FILE": "ca/file/path",
        "BAILO_URL": os.environ["BAILO_URL"],
    },
)
@patch("bailoclient.bailo.load_dotenv", return_value=True)
@patch("bailoclient.bailo.getpass.getpass", return_value="pwd")
@patch("bailoclient.bailo.Client.__init__")
@patch("bailoclient.bailo.Client.connect")
def test_bailo_calls_connect_with_no_params_if_pki_auth(
    mock_client_connect, mock_client_init, mock_get_pass, mock_load_dotenv
):
    bailo = Bailo()

    mock_client_connect.assert_called_once_with()


@patch("bailoclient.bailo.getpass.getpass", return_value="pwd")
def test_pki_client_creates_config_for_authentication(mock_get_pass, bailo_client):
    config, auth = bailo_client.pki_client(
        "p12/file", "ca/file", os.environ["BAILO_URL"]
    )

    assert isinstance(config, BailoConfig)
    assert auth == Pkcs12Authenticator


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


@patch("bailoclient.bailo.os.path.abspath")
@patch("bailoclient.model_handlers.model_bundler.Bundler.bundle_model")
def test_bundle_model_formats_inputs(mock_bundle_model, mock_abspath, bailo_client):
    def mock_abs_path(path):
        if path.endswith("/"):
            return path[0:-1]
        return path

    mock_abspath.side_effect = mock_abs_path

    output_path = "output_path/"
    model_binary = "model_binary/"
    model_py = "model_py/"
    model_requirements = "model_requirements"
    model_flavour = "pytorch"
    additional_files = ["additional_files/file_1.py", "additional_files/file_2.py"]

    bailo_client.bundle_model(
        output_path=output_path,
        model_binary=model_binary,
        model_py=model_py,
        model_requirements=model_requirements,
        model_flavour=model_flavour,
        additional_files=additional_files,
    )

    mock_bundle_model.assert_called_once_with(
        output_path="output_path",
        model=None,
        model_binary="model_binary",
        model_py="model_py",
        model_requirements=model_requirements,
        requirements_files_path=None,
        model_flavour=model_flavour,
        additional_files=additional_files,
    )

    assert mock_abspath.call_count == 6


@patch("bailoclient.bailo.os.makedirs")
@patch("bailoclient.bailo.os.path.exists", return_value=False)
@patch("bailoclient.model_handlers.model_bundler.Bundler.generate_requirements_file")
def test_generate_requirements_file_formats_inputs_and_creates_output_directory_if_it_does_not_exist(
    mock_gen_requirements, mock_path_exists, mock_mkdir, bailo_client
):
    module_path = "/path/"
    output_path = "./output/somewhere"

    bailo_client.generate_requirements_file(module_path, output_path)

    expected_output_dir = "output/somewhere"
    expected_module_path = "/path"
    expected_output_path = "output/somewhere/requirements.txt"

    mock_mkdir.assert_called_once_with(expected_output_dir, exist_ok=True)
    mock_gen_requirements.assert_called_once_with(
        expected_module_path, expected_output_path
    )
