import pytest

from bailoclient.config import *


@pytest.fixture
def simple_config():
    """Creates a simple configuration object with made up values"""

    return BailoConfig(
        cognito=CognitoConfig(
            user_pool_id="a4985vnqw094tn4itbjmpq0e598uytn[qv30957u",
            client_id="pv95n76q5q3b698qn354096b8uQ£%B^$%^",
            client_secret="4qb4359068nrjtyvmne5pouybe5YNQ$£uye6bvu 6",
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
