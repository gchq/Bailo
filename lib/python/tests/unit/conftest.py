import os
import tempfile
import pytest

from bailoclient import Bailo
from bailoclient.client import Client
from bailoclient.config import BailoConfig, Pkcs12Config, CognitoConfig


os.environ["MINIMAL_MODEL_PATH"] = "../../frontend/cypress/fixtures"


@pytest.fixture
def bailo_url() -> str:
    url = os.getenv("BAILO_URL")
    print(url)
    if url:
        return url
    return "http://bailo.com/test/api"


@pytest.fixture
def temp_dir() -> str:
    with tempfile.TemporaryDirectory() as temp_dir_name:
        yield temp_dir_name


@pytest.fixture
def timeout_period() -> int:
    return 10


@pytest.fixture
def pki_bailo_config(bailo_url, timeout_period) -> BailoConfig:
    return BailoConfig(
        auth=Pkcs12Config(
            pkcs12_filename="test-cert.crt", pkcs12_password="test-password"
        ),
        bailo_url=bailo_url,
        timeout_period=timeout_period,
    )


@pytest.fixture
def cognito_bailo_config(bailo_url, timeout_period) -> BailoConfig:
    return BailoConfig(
        auth=CognitoConfig(
            username="username",
            password="password",
            user_pool_id="user-pool-id",
            client_id="client-id",
            client_secret="client-secret",
            region="region",
        ),
        bailo_url=bailo_url,
        timeout_period=timeout_period,
    )


@pytest.fixture
def null_bailo_config(bailo_url, timeout_period) -> BailoConfig:
    return BailoConfig(
        auth=None,
        bailo_url=bailo_url,
        timeout_period=timeout_period,
    )


@pytest.fixture
def null_client(null_bailo_config) -> Client:
    return Client(null_bailo_config)


@pytest.fixture
def null_bailo(null_bailo_config) -> Bailo:
    return Bailo(null_bailo_config)
