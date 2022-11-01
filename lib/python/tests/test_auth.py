from unittest.mock import MagicMock

import pytest
import os

from ..bailoclient.auth import CognitoSRPAuthenticator
from ..bailoclient.config import APIConfig, BailoConfig, CognitoConfig
from ..bailoclient.utils.exceptions import UnauthorizedException


@pytest.fixture()
def cognito_authenticator():
    cognito_config = CognitoConfig(
        user_pool_id="COGNITO_USERPOOL",
        client_id="COGNITO_CLIENT_ID",
        client_secret="COGNITO_CLIENT_SECRET",
        region="COGNITO_REGION",
    )

    config = BailoConfig(
        cognito=cognito_config,
        api=APIConfig(url=os.environ["BAILO_URL"], ca_verify=True),
    )

    authenticator = CognitoSRPAuthenticator(config)
    aws_auth_response = {"AuthenticationResult": {"AccessToken": "token"}}
    authenticator._CognitoSRPAuthenticator__try_authorise = MagicMock(
        return_value=aws_auth_response
    )

    return authenticator


def test_authenticate_user(cognito_authenticator):
    assert not cognito_authenticator.is_authenticated()


def test_authenticate_user_true_after_authentication(cognito_authenticator):
    cognito_authenticator.authenticate_user("COGNITO_USERNAME", "COGNITO_PASSWORD")

    assert cognito_authenticator.is_authenticated()


def test_auth_headers_raises_error_if_not_authenticated(cognito_authenticator):
    with pytest.raises(
        UnauthorizedException, match="Authenticator not yet authorised."
    ):
        cognito_authenticator.get_authorisation_headers()


def test_auth_headers_(cognito_authenticator):
    cognito_authenticator.authenticate_user("COGNITO_USERNAME", "COGNITO_PASSWORD")

    headers = cognito_authenticator.get_authorisation_headers()

    assert headers.get("Authorization")
