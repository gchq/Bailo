"""Configuration settings for FastAPI app."""

from __future__ import annotations

from typing import Any

from modelscan.settings import DEFAULT_SETTINGS
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Basic settings object for the FastAPI app.

    :param BaseSettings: Default template object.
    """

    app_name: str = "Bailo ArtefactScan API"
    app_summary: str = "REST API wrapper for ModelScan package and Trivy DB for use with Bailo."
    app_description: str = """
    Bailo ArtefactScan API allows for easy programmatic interfacing with:
    * ProtectAI's ModelScan package to scan and detect potential threats within files.
    * Aqua's Trivy DB to scan and detect vulnerabilities within images.

    You can POST files & images then view the result."""
    app_version: str = "4.0.0"
    modelscan_settings: dict[str, Any] = DEFAULT_SETTINGS
    block_size: int = 1024
    maximum_filesize: int = 4 * 1024**3  # 4GB

    # Load in a dotenv file to set/overwrite any properties with potentially sensitive values
    model_config = SettingsConfigDict(env_file=".env")
