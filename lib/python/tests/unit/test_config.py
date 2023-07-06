import pytest
from unittest.mock import patch

from bailoclient.config import *


COGNITO_ENVIRON = {
    "COGNITO_USERNAME": "username",
    "COGNITO_PASSWORD": "password",
    "COGNITO_USERPOOL": "userpool",
    "COGNITO_CLIENT_ID": "client-id",
    "COGNITO_CLIENT_SECRET": "client-secret",
    "COGNITO_REGION": "region",
    "BAILO_URL": "http://bailo",
}
PKI_ENVIRON = {
    "PKI_CERT_PATH": "cert.pem",
    "PKI_CERT_PASSWORD": "password",
    "BAILO_URL": "http://bailo",
}
NULL_ENVIRON = {"BAILO_URL": "http://bailo", "BAILO_CA_CERT": "False"}


@patch.dict(os.environ, COGNITO_ENVIRON, clear=True)
def test_create_cognito_config_from_env():
    config = CognitoConfig.from_env()
    assert config.username == "username"
    assert config.password == "password"
    assert config.user_pool_id == "userpool"
    assert config.client_id == "client-id"
    assert config.client_secret == "client-secret"
    assert config.region == "region"


@patch.dict(os.environ, {}, clear=True)
def test_create_cognito_config_from_env_fails_missing_env():
    with pytest.raises(KeyError):
        CognitoConfig.from_env()


@patch.dict(os.environ, COGNITO_ENVIRON, clear=True)
def test_create_bailo_config_from_env_cognito():
    config = BailoConfig.from_env(AuthType.COGNITO)
    assert config.auth == CognitoConfig.from_env()
    assert config.bailo_url == "http://bailo"


@patch.dict(os.environ, {}, clear=True)
def test_create_bailo_config_from_env_fails_missing_env_cognito():
    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.COGNITO)


@patch.dict(os.environ, COGNITO_ENVIRON, clear=True)
def test_create_bailo_config_from_env_fails_wrong_auth_type_cognito():
    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.PKI)


@patch.dict(os.environ, PKI_ENVIRON, clear=True)
def test_create_pki_config_from_env():
    config = Pkcs12Config.from_env()
    assert config.pkcs12_filename == "cert.pem"
    assert config.pkcs12_password == "password"


@patch.dict(os.environ, {}, clear=True)
def test_create_pki_config_from_env_fails_missing_env():
    with pytest.raises(KeyError):
        Pkcs12Config.from_env()


@patch.dict(os.environ, PKI_ENVIRON, clear=True)
def test_create_bailo_config_with_pki_from_env():
    config = BailoConfig.from_env(AuthType.PKI)
    assert config.auth == Pkcs12Config.from_env()
    assert config.bailo_url == "http://bailo"


@patch.dict(os.environ, PKI_ENVIRON, clear=True)
def test_create_bailo_config_from_env_fails_wrong_env_pki():
    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.COGNITO)


@patch.dict(os.environ, NULL_ENVIRON, clear=True)
def test_create_bailo_config_from_env_null():
    config = BailoConfig.from_env(AuthType.NULL)
    assert config.auth is None
    assert config.bailo_url == "http://bailo"
    assert config.ca_verify is False


@patch.dict(os.environ, {}, clear=True)
def test_create_bailo_config_from_env_fails_missing_env_null():
    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.NULL)


def test_bailo_config_load_save_cognito(temp_dir):
    """Check we can save a configuration file and then reload it"""

    config = BailoConfig(
        auth=CognitoConfig(
            username="test-username",
            password="test-password",
            user_pool_id="a4985vnqw094tn4itbjmpq0e598uytn[qv30957u",
            client_id="pv95n76q5q3b698qn354096b8uQ£%B^$%^",
            client_secret="4qb4359068nrjtyvmne5pouybe5YNQ$£uye6bvu 6",
            region="eu-west-2",
        ),
        bailo_url="https://www.example.com/api",
        ca_verify=False,
    )

    config_path = os.path.join(temp_dir, "conf.yaml")

    config.save(config_path)
    loaded_config = BailoConfig.load(config_path)

    assert isinstance(loaded_config, BailoConfig)
    assert isinstance(loaded_config.auth, CognitoConfig)
    assert config == loaded_config


def test_bailo_config_load_save_pki(temp_dir):
    """Check we can save a configuration file and then reload it"""

    config = BailoConfig(
        auth=Pkcs12Config(pkcs12_filename="cert.pem", pkcs12_password="password"),
        bailo_url="https://www.example.com/api",
        ca_verify=False,
    )

    config_path = os.path.join(temp_dir, "conf.yaml")

    config.save(config_path)
    loaded_config = BailoConfig.load(config_path)

    assert isinstance(loaded_config, BailoConfig)
    assert isinstance(loaded_config.auth, Pkcs12Config)
    assert config == loaded_config


def test_bailo_config_load_save_null(temp_dir):
    """Check we can save a configuration file and then reload it"""

    config = BailoConfig(
        auth=None,
        bailo_url="https://www.example.com/api",
        ca_verify=False,
    )

    config_path = os.path.join(temp_dir, "conf.yaml")

    config.save(config_path)
    loaded_config = BailoConfig.load(config_path)

    assert isinstance(loaded_config, BailoConfig)
    assert loaded_config.auth is None
    assert config == loaded_config
