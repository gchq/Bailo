"""Configuration settings for FastAPI app.
"""

from __future__ import annotations

import logging
from typing import Any

from modelscan.settings import DEFAULT_SETTINGS
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Basic settings object for the FastAPI app.

    :param BaseSettings: Default template object.
    """

    app_name: str = "Bailo ModelScan API"
    app_summary: str = "REST API wrapper for ModelScan package for use with Bailo."
    app_description: str = """
    Bailo ModelScan API allows for easy programmatic interfacing with ProtectAI's ModelScan package to scan and detect potential threats within files stored in Bailo.

    You can upload files and view modelscan's result."""
    app_version: str = "1.0.0"
    download_dir: str = "."
    modelscan_settings: dict[str, Any] = DEFAULT_SETTINGS
    block_size: int = 1024

    # Load in a dotenv file to set/overwrite any properties with potentially sensitive values
    model_config = SettingsConfigDict(env_file=".env")


logger.info("Instantiating settings.")
settings = Settings()
