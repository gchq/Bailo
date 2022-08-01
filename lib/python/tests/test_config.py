import pytest

from ..bailoclient.config import *


@pytest.fixture
def simple_config():
    """Creates a simple configuration object with made up values"""

    return BailoConfig(
        cognito=CognitoConfig(
            user_pool_id="example_user_pool",
            client_id="example_client_id",
            client_secret="example_client_secret",
            region="eu-west-2",
        ),
        api=APIConfig(url="https://www.example.com/api", ca_verify=False),
    )


def test_config_load_save(tmp_path, simple_config):
    """Check we can save a configuration file and then reload it"""

    tmp_file = os.path.join(tmp_path, "conf.yaml")

    save_config(simple_config, tmp_file)
    test_config = load_config(tmp_file)

    assert simple_config == test_config
