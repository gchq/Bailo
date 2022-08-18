import os

import pytest
from dotenv import load_dotenv

from ..bailoclient.auth import CognitoSRPAuthenticator
from ..bailoclient.config import APIConfig, BailoConfig, CognitoConfig
from ..bailoclient.utils.exceptions import UnauthorizedException

load_dotenv()


@pytest.fixture()
def authenticator():
    return cognito_authenticator()


def cognito_authenticator():
    cognito_config = CognitoConfig(
        user_pool_id=os.environ["BAILO_USERPOOL"],
        client_id=os.environ["BAILO_CLIENT_ID"],
        client_secret=os.environ["BAILO_CLIENT_SECRET"],
        region=os.environ["BAILO_REGION"],
    )

    config = BailoConfig(
        cognito=cognito_config, api=APIConfig(url="http://bailo.com", ca_verify=True)
    )

    return CognitoSRPAuthenticator(config)


def user_authenticated_cognito(authenticator):
    try:
        return authenticator.authenticate_user(
            username=os.environ["BAILO_USERNAME"], password=os.environ["BAILO_PASSWORD"]
        )
    except:
        return False


@pytest.mark.skipif(
    user_authenticated_cognito(cognito_authenticator()) is False,
    reason="requires user to be authenticated with cognito",
)
def test_authenticate_user(authenticator):
    assert not authenticator.is_authenticated()


@pytest.mark.skipif(
    user_authenticated_cognito(cognito_authenticator()) is False,
    reason="requires user to be authenticated with cognito",
)
def test_authenticate_user_true_after_authentication(authenticator):
    authenticator.authenticate_user(
        os.environ["BAILO_USERNAME"], os.environ["BAILO_PASSWORD"]
    )
    assert authenticator.is_authenticated()


@pytest.mark.skipif(
    user_authenticated_cognito(cognito_authenticator()) is False,
    reason="requires user to be authenticated with cognito",
)
def test_auth_headers_raises_error_if_not_authenticated(authenticator):
    with pytest.raises(
        UnauthorizedException, match="Authenticator not yet authorised."
    ):
        authenticator.get_authorisation_headers()


@pytest.mark.skipif(
    user_authenticated_cognito(cognito_authenticator()) is False,
    reason="requires user to be authenticated with cognito",
)
def test_auth_headers_(authenticator):
    authenticator.authenticate_user(
        os.environ["BAILO_USERNAME"], os.environ["BAILO_PASSWORD"]
    )
    headers = authenticator.get_authorisation_headers()

    assert headers.get("Authorization")
