"""Config for API, auth and Bailo"""

import json
import os
from typing import Optional, Union

import yaml
from pydantic import BaseSettings, HttpUrl


class APIConfig(BaseSettings):
    """Configuration for the Bailo API"""

    url: HttpUrl
    ca_verify: Union[bool, str]


class Pkcs12Config(BaseSettings):
    """Configuration for connecting using Pkcs12 certificate"""

    pkcs12_filename: str
    pkcs12_password: str


class CognitoConfig(BaseSettings):
    """Configuration for connecting to an AWS Cognito instance."""

    user_pool_id: str
    client_id: str
    client_secret: str
    region: str


class BailoConfig(BaseSettings):
    """Master configuration object"""

    cognito: Optional[CognitoConfig]
    pki: Optional[Pkcs12Config]
    api: APIConfig


def load_config(config_path: os.PathLike) -> BailoConfig:
    """Loads and validates a configuration file.
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
        config = BailoConfig.parse_obj(config_data)

    except Exception as exc:
        raise RuntimeError(
            "Configuration file data could not be interpreted as a valid config."
        ) from exc

    return config


def save_config(config: BailoConfig, config_path: os.PathLike):
    """Saves a current config as a yaml file. Raises an exception if it is unable to save.

    Args:
        config (BailoConfig): A python config object
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
        yaml.dump(json.loads(config.json()), file)
