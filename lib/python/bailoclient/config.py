"""Config for API, auth and Bailo"""

import json
import os
from enum import Enum
from typing import Optional, Union

import yaml
from pydantic import BaseSettings


class AuthenticationConfig(BaseSettings):
    """Base class for authentication config"""


class Pkcs12Config(AuthenticationConfig):
    """Configuration for connecting using Pkcs12 certificate"""

    pkcs12_filename: str
    pkcs12_password: str

    @classmethod
    def from_env(cls) -> "Pkcs12Config":
        """
        Load PKI authentication config from environment variables

        Returns:
            Pkcs12Config: A cognito authentication configuration object
        """
        return cls(
            pkcs12_filename=os.environ["PKI_CERT_PATH"],
            pkcs12_password=os.environ["PKI_CERT_PASSWORD"],
        )


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


class AuthType(Enum):
    """Enumeration of compatible authentication types"""

    COGNITO = "cognito"
    PKI = "pki"
    NULL = "null"


class BailoConfig(BaseSettings):
    """Master configuration object"""

    auth: Optional[Union[CognitoConfig, Pkcs12Config]] = None
    bailo_url: str
    ca_verify: Union[bool, str] = True
    timeout_period: int = 5  # timeout periods in seconds

    @classmethod
    def from_env(cls, auth_type: AuthType):
        """
        Load Bailo config from environment variables

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
            ca_verify=os.getenv("CA_CERT") or True,
        )

    def save(self, config_path: Union[os.PathLike, str]) -> None:
        """
        Saves a current config as a yaml file.
        Raises an exception if it is unable to save.

        Args:
            config_path (os.PathLike): Target path to save as a yaml file

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
            config_path (os.PathLike): A path object pointing to a yaml configuration file

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
