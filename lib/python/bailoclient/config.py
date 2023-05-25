"""Config classes for Client and Auth"""

import json
import os
from typing import Optional, Union

import yaml
from pydantic import BaseSettings

from bailoclient.enums import AuthType


class AuthenticationConfig(BaseSettings):
    """Base class for authentication config"""


class CognitoConfig(AuthenticationConfig):
    """Configuration for connecting to an AWS Cognito instance."""

    username: str
    password: str
    user_pool_id: str
    client_id: str
    client_secret: str
    region: str

    @classmethod
    def from_env(cls) -> "CognitoConfig":
        """
        Load Cognito authentication config from environment variables

        The following environment variable are supported:
            * COGNITO_USERNAME
            * COGNITO_PASSWORD
            * COGNITO_USERPOOL
            * COGNITO_CLIENT_ID
            * COGNITO_CLIENT_SECRET
            * COGNITO_REGION

        Returns:
            CognitoConfig: A cognito authentication configuration object
        """
        return cls(
            username=os.environ["COGNITO_USERNAME"],
            password=os.environ["COGNITO_PASSWORD"],
            user_pool_id=os.environ["COGNITO_USERPOOL"],
            client_id=os.environ["COGNITO_CLIENT_ID"],
            client_secret=os.environ["COGNITO_CLIENT_SECRET"],
            region=os.getenv("COGNITO_REGION"),
        )


class Pkcs12Config(AuthenticationConfig):
    """Configuration for connecting using Pkcs12 certificate"""

    pkcs12_filename: str
    pkcs12_password: str

    @classmethod
    def from_env(cls) -> "Pkcs12Config":
        """Load PKI authentication config from environment variables.

        The following environment variable are supported:
            * PKI_CERT_PATH: the path to your PKI certificate
            * PKI_CERT_PASSWORD: the password for your PKI certificate.

        If you don't want to expose your password as an environment variable
        please use bailoclient.create_pki_client and you will be prompted for your password.

        Returns:
            Pkcs12Config: A cognito authentication configuration object
        """
        return cls(
            pkcs12_filename=os.environ["PKI_CERT_PATH"],
            pkcs12_password=os.environ["PKI_CERT_PASSWORD"],
        )


class BailoConfig(BaseSettings):
    """Bailo configuration object"""

    auth: Optional[Union[CognitoConfig, Pkcs12Config]] = None
    bailo_url: str
    ca_verify: Union[bool, str] = True
    timeout_period: int = 5  # timeout periods in seconds
    aws_gateway: bool = True  # Is Bailo load balanced with an AWS gateway

    @classmethod
    def from_env(cls, auth_type: AuthType):
        """
        Load Bailo config from environment variables.

        The following environment variable are supported:
            * BAILO_URL: the url of the bailo instance to connect to
            * BAILO_CA_CERT: path to a CA certificate to use for HTTPS connections. Set to "false" to disable TLS verification
            * BAILO_CONNECTION_TIMEOUT: Connection timeout period, defaults to 5
            * BAILO_AWS_GATEWAY: Set to True is Bailo is load-balanced with an AWS gateway.

        Refer to your specific authentication config documentations for its supported environment variables.

        Args:
            auth_type: The type of authentication needed to authorise to the bailo instance

        Returns:
            BailoConfig: A configuration object
        """

        if auth_type is AuthType.COGNITO:
            auth = CognitoConfig.from_env()

        elif auth_type is AuthType.PKI:
            auth = Pkcs12Config.from_env()

        elif auth_type is AuthType.NULL:
            auth = None

        else:
            auth = None

        return BailoConfig(
            auth=auth,
            bailo_url=os.environ["BAILO_URL"],
            ca_verify=os.getenv("BAILO_CA_CERT") or True,
            aws_gateway=os.getenv("BAILO_AWS_GATEWAY") or True,
            timeout_period=os.getenv("BAILO_CONNECTION_TIMEOUT") or 5,
        )

    def save(self, config_path: Union[os.PathLike, str]) -> None:
        """
        Saves a current config as a yaml file.
        Raises an exception if it is unable to save.

        Args:
            config_path: Target path to save as a yaml file

        Raises:
            IsADirectoryError: Path is a directory not a file
        """

        if os.path.isdir(config_path):
            raise IsADirectoryError(
                f"Invalid configuration filepath. {config_path} is a directory"
            )

        with open(config_path, "w", encoding="utf-8") as file:
            # Do a round-trip via JSON to take advantage of pydantics encoders
            yaml.dump(json.loads(self.json()), file)

    @classmethod
    def load(cls, config_path: Union[os.PathLike, str]) -> "BailoConfig":
        """
        Loads and validates a configuration file.
        Raises an exception if unable to read or load the file.

        Args:
            config_path: A path object pointing to a yaml configuration file

        Raises:
            FileNotFoundError: _description_
            RuntimeError: _description_

        Returns:
            BailoConfig: A configuration object
        """

        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Configuration file {config_path} not found")

        with open(config_path, "r", encoding="utf-8") as file:
            config_data = yaml.safe_load(file)

        try:
            return cls.parse_obj(config_data)

        except Exception as exc:
            raise RuntimeError(
                "Configuration file data could not be interpreted as a valid config."
            ) from exc
