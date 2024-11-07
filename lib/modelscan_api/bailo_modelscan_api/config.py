from typing import Any

from modelscan.settings import DEFAULT_SETTINGS
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Basic settings object for the FastAPI app.

    :param BaseSettings: Default template object.
    """

    app_name: str = "Bailo ModelScan API"
    download_dir: str = "."  # TODO: use this
    modelscan_settings: dict[str, Any] = DEFAULT_SETTINGS
    block_size: int = 1024
    bailo_client_url: str = "http://localhost:8080/"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
