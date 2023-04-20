import pytest
from unittest.mock import patch

from bailoclient.config import *


def test_bailo_config_load_save_cognito(tmp_path):
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

    config_path = os.path.join(tmp_path, "conf.yaml")

    config.save(config_path)
    loaded_config = BailoConfig.load(config_path)

    assert isinstance(loaded_config, BailoConfig)
    assert isinstance(loaded_config.auth, CognitoConfig)
    assert config == loaded_config


def test_bailo_config_load_save_pki(tmp_path):
    """Check we can save a configuration file and then reload it"""

    config = BailoConfig(
        auth=Pkcs12Config(pkcs12_filename="cert.pem", pkcs12_password="password"),
        bailo_url="https://www.example.com/api",
        ca_verify=False,
    )

    config_path = os.path.join(tmp_path, "conf.yaml")

    config.save(config_path)
    loaded_config = BailoConfig.load(config_path)

    assert isinstance(loaded_config, BailoConfig)
    assert isinstance(loaded_config.auth, Pkcs12Config)
    assert config == loaded_config


def test_bailo_config_load_save_null(tmp_path):
    """Check we can save a configuration file and then reload it"""

    config = BailoConfig(
        auth=None,
        bailo_url="https://www.example.com/api",
        ca_verify=False,
    )

    config_path = os.path.join(tmp_path, "conf.yaml")

    config.save(config_path)
    loaded_config = BailoConfig.load(config_path)

    assert isinstance(loaded_config, BailoConfig)
    assert loaded_config.auth is None
    assert config == loaded_config


@patch.dict(
    os.environ,
    {
        "PKI_CERT_PATH": "cert.pem",
        "PKI_CERT_PASSWORD": "password",
        "BAILO_URL": "http://bailo",
    },
    clear=True,
)
def test_create_bailo_config_from_env_pki():
    config = BailoConfig.from_env(AuthType.PKI)
    assert isinstance(config.auth, Pkcs12Config)
    assert config.auth.pkcs12_filename == "cert.pem"
    assert config.auth.pkcs12_password == "password"
    assert config.bailo_url == "http://bailo"

    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.COGNITO)


def test_create_bailo_config_from_env_pki_fail():
    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.PKI)


@patch.dict(
    os.environ,
    {
        "COGNITO_USERNAME": "username",
        "COGNITO_PASSWORD": "password",
        "COGNITO_USERPOOL": "userpool",
        "COGNITO_CLIENT_ID": "client-id",
        "COGNITO_CLIENT_SECRET": "client-secret",
        "COGNITO_REGION": "region",
        "BAILO_URL": "http://bailo",
    },
    clear=True,
)
def test_create_bailo_config_from_env_cognito():
    config = BailoConfig.from_env(AuthType.COGNITO)
    assert isinstance(config.auth, CognitoConfig)
    assert config.auth.username == "username"
    assert config.auth.password == "password"
    assert config.auth.user_pool_id == "userpool"
    assert config.auth.client_id == "client-id"
    assert config.auth.client_secret == "client-secret"
    assert config.auth.region == "region"
    assert config.bailo_url == "http://bailo"

    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.PKI)


def test_create_bailo_config_from_env_cognito_fail():
    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.COGNITO)


@patch.dict(os.environ, {"BAILO_URL": "http://bailo", "CA_CERT": "False"}, clear=True)
def test_create_bailo_config_from_env_null():
    config = BailoConfig.from_env(AuthType.NULL)
    assert config.auth is None
    assert config.bailo_url == "http://bailo"
    assert config.ca_verify is False


@patch.dict(os.environ, {}, clear=True)
def test_create_bailo_config_from_env_null_fail():
    with pytest.raises(KeyError):
        BailoConfig.from_env(AuthType.NULL)
