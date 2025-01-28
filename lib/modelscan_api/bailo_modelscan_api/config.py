"""Configuration settings for FastAPI app.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

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
    # Update frontend/pages/docs/administration/helm/configuration.mdx if bumping this.
    app_version: str = "1.0.0"
    # download_dir is used if it evaluates, otherwise a temporary directory is used.
    download_dir: Optional[str] = None
    modelscan_settings: dict[str, Any] = DEFAULT_SETTINGS
    block_size: int = 1024

    # Load in a dotenv file to set/overwrite any properties with potentially sensitive values
    model_config = SettingsConfigDict(env_file=".env")
