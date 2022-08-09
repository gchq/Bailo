"""Authorised clients"""

# pylint: disable=too-many-arguments

from typing import Union

from .auth import CognitoSRPAuthenticator, Pkcs12Authenticator
from .client import Client
from .config import APIConfig, BailoConfig, CognitoConfig, Pkcs12Config


def create_cognito_client(
    url: str,
    user_pool_id: str,
    client_id: str,
    client_secret: str,
    region: str,
    ca_verify: Union[bool, str] = True,
) -> Client:
    """Creates a configured Bailo client using the passed parameters
    Args:
        url (str): URL of the Bailo API
        user_pool_id (str): User Pool Id for the AWS Cognito user pool
        client_id (str): AWS Cognito Id associated with the Bailo app
        client_secret (str): AWS Cognito secret associated with the Bailo app
        region (str): AWS Region
        ca_verify (Union[bool,str], optional): the location of the file to use for
                                               certificate verification.
                                               False for no verification, True to use
                                               bundled ca certs. Defaults to True.

    Returns:
        Client: A configured Bailo API Client
    """
    cognito_config = CognitoConfig(
        user_pool_id=user_pool_id,
        client_id=client_id,
        client_secret=client_secret,
        region=region,
    )
    api_config = APIConfig(url=url, ca_verify=ca_verify)
    config = BailoConfig(cognito=cognito_config, api=api_config)

    client = Client(config, CognitoSRPAuthenticator)
    return client


def create_pki_client(
    url: str,
    pkcs12_filename: str,
    pkcs12_password: str,
    ca_verify: Union[bool, str] = True,
) -> Client:
    """Creates a configured Bailo client using the passed parameters

    Args:
        url (str): URL of the Bailo API
        pkcs12_filename (str): location of pkcs12 file to use to authenticate with Bailo
        pkcs12_password (str): the password associated with the pkcs12_filename
        ca_verify (Union[bool,str], optional): the location of the file to use for
                                               certificate verification.
                                               False for no verification, True to use
                                               bundled ca certs. Defaults to True.

    Returns:
        Client: A configured Bailo API Client
    """
    pki_config = Pkcs12Config(
        pkcs12_filename=pkcs12_filename, pkcs12_password=pkcs12_password
    )
    api_config = APIConfig(url=url, ca_verify=ca_verify)
    config = BailoConfig(pki=pki_config, api=api_config)

    client = Client(config, Pkcs12Authenticator)
    return client
