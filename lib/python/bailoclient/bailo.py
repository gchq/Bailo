""" Facade for Bailo client """

# pylint: disable="line-too-long"

import os
import logging
import getpass
from typing import Union

from dotenv import load_dotenv

from bailoclient.utils.exceptions import (
    IncompleteDotEnvFile,
    MissingDotEnvFile,
    UnableToCreateBailoClient,
)

from .auth import CognitoSRPAuthenticator, Pkcs12Authenticator
from .client import Client
from .config import APIConfig, BailoConfig, CognitoConfig, Pkcs12Config

logger = logging.getLogger(__name__)


class Bailo(Client):
    """Facade for Bailo client"""

    def __init__(
        self,
        bailo_url: str = None,
        pki_p12: str = None,
        pki_ca: str = None,
        cognito_user_pool_id: str = None,
        cognito_client_id: str = None,
        cognito_client_secret: str = None,
        cognito_region: str = None,
        cognito_username: str = None,
        cognito_pwd: str = None,
    ):

        # if no config provided, try and load dotenv file
        if not any(
            [
                bailo_url,
                pki_p12,
                pki_ca,
                cognito_user_pool_id,
                cognito_client_id,
                cognito_client_secret,
                cognito_region,
                cognito_username,
                cognito_pwd,
            ]
        ):
            env_loaded = load_dotenv()

            if not env_loaded:
                raise MissingDotEnvFile(
                    "Unable to find a .env file in the project directory"
                )

            config, auth, *creds = self.__create_client_from_env()

        # create pki client from input
        if pki_p12 and pki_ca and bailo_url:
            config, auth = self.pki_client(pki_p12, pki_ca, bailo_url)

        # create cognito client from input
        if (
            cognito_user_pool_id
            and cognito_client_id
            and cognito_client_secret
            and cognito_region
            and cognito_username
            and cognito_pwd
            and bailo_url
        ):
            config, auth = self.cognito_client(
                cognito_user_pool_id,
                cognito_client_id,
                cognito_client_secret,
                cognito_region,
                bailo_url,
            )
            creds = cognito_username, cognito_pwd

        try:
            super().__init__(config, auth)

        except NameError as err:
            raise UnableToCreateBailoClient(
                """Ensure you have provided all the required Cognito or PKI parameters and a valid BAILO URL"""
            ) from err

        try:
            username, password = creds
            self.connect(username=username, password=password)

        except ValueError:
            self.connect()

    def __create_client_from_env(self):
        """Create a Client from configuration saved in a .env file

        Raises:
            IncompleteDotEnvFile: .env file doesn't contain all the required config

        Returns:
            Client: Authorised client
        """
        cognito_success = True
        pki_success = True

        # attempt to get cognito credentials
        try:
            (
                user_pool_id,
                client_id,
                client_secret,
                region,
                url,
                username,
                password,
            ) = self.__get_cognito_auth_properties()

        except KeyError:
            cognito_success = False

        # attempt to create cognito client
        if cognito_success:
            config, auth = self.cognito_client(
                user_pool_id, client_id, client_secret, region, url
            )
            return config, auth, username, password

        # attempt to get p12 credentials
        try:
            p12_file, ca_file, url = self.__get_pki_auth_properties()

        except KeyError:
            pki_success = False

        # attempt to create pki client
        if pki_success:
            config, auth = self.pki_client(p12_file, ca_file, url)
            return config, auth

        raise IncompleteDotEnvFile(
            "Unable to get all the required Cognito or PKI auth properties from .env file"
        )

    def cognito_client(
        self,
        user_pool_id: str,
        client_id: str,
        client_secret: str,
        region: str,
        bailo_url: str,
        ca_verify: Union[bool, str] = True,
    ):
        """Create an authorised Cognito client

        Args:
            user_pool_id (str): Cognito user pool ID
            client_id (str): Cognito client ID
            client_secret (str): Cognito client secret
            region (str): Cognito region
            bailo_url (str): Bailo URL
            username (str): Cognito username
            password (str): Cognito password

        Returns:
            Client: Authorised Bailo Client
        """

        cognito_config = CognitoConfig(
            user_pool_id=user_pool_id,
            client_id=client_id,
            client_secret=client_secret,
            region=region,
        )
        api_config = APIConfig(url=bailo_url, ca_verify=ca_verify)
        config = BailoConfig(cognito=cognito_config, api=api_config)

        return config, CognitoSRPAuthenticator

    def pki_client(self, p12_file: str, ca_verify: str, url: str):
        """Create an authorised PKI client

        Args:
            p12_file (str): Path to P12 file
            ca_verify (str): Path to CA file
            url (str): Bailo URL

        Returns:
            Client: Authorised Bailo Client
        """
        p12_pwd = getpass.getpass(
            prompt=f"Enter your password for {os.getenv('p12_file')}: "
        )

        pki_config = Pkcs12Config(pkcs12_filename=p12_file, pkcs12_password=p12_pwd)
        api_config = APIConfig(url=url, ca_verify=ca_verify)
        config = BailoConfig(pki=pki_config, api=api_config)

        return config, Pkcs12Authenticator

    def __get_cognito_auth_properties(self):
        """Extract properties required for Cognito auth from environment

        Returns:
            Tuple[str]): Values for Cognito config
        """
        try:
            userpool = os.environ["COGNITO_USERPOOL"]
            client_id = os.environ["COGNITO_CLIENT_ID"]
            client_secret = os.environ["COGNITO_CLIENT_SECRET"]
            region = os.environ["COGNITO_REGION"]
            url = os.environ["BAILO_URL"]
            username = os.environ["COGNITO_USERNAME"]
            password = os.environ["COGNITO_PASSWORD"]

        except KeyError as err:
            logger.info(
                "Unable to find required environment variables for Cognito authentication: %s not found",
                str(err),
            )
            raise KeyError(str(err)) from err

        return userpool, client_id, client_secret, region, url, username, password

    def __get_pki_auth_properties(self):
        """Extract properties required for PKI auth from environment

        Returns:
            Tuple[str]): Values for PKI config
        """
        try:
            p12_file = os.environ["P12_FILE"]
            ca_file = os.environ["CA_FILE"]
            bailo_url = os.environ["BAILO_URL"]

        except KeyError as err:
            logger.info(
                "Unable to find required environment variables for PKI authentication: %s not found",
                str(err),
            )
            raise KeyError(str(err)) from err

        return p12_file, ca_file, bailo_url
