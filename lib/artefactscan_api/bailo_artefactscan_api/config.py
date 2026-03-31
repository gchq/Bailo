"""Configuration settings for FastAPI app."""

from __future__ import annotations

from ssl import SSLContext
from typing import Any

from httpx._types import CertTypes
from modelscan.settings import DEFAULT_SETTINGS
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Basic settings object for the FastAPI app.

    :param BaseSettings: Default template object.
    """

    app_name: str = "Bailo ArtefactScan API"
    app_summary: str = "API for scanning files and container image layers for security threats and vulnerabilities."
    app_description: str = (
        "The Bailo ArtefactScan API provides programmatic scanning capabilities for artefacts submitted to Bailo. It integrates:\n"
        "* **ProtectAI ModelScan** for detecting malicious or unsafe content within uploaded files.\n"
        "* **Aqua Trivy vulnerability database** for identifying known vulnerabilities in container image layers.\n"
        "\n"
        "Clients can upload files or image layers and retrieve structured scan results via a REST interface."
    )
    app_version: str = "4.0.2"
    modelscan_settings: dict[str, Any] = DEFAULT_SETTINGS
    block_size: int = 1024
    maximum_filesize: int = 4 * 1024**3  # 4GB

    # Load in a dotenv file to set/overwrite any properties with potentially sensitive values
    model_config = SettingsConfigDict(env_file=".env")
