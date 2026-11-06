from __future__ import annotations

import importlib.metadata
import logging

logging.getLogger(__name__).addHandler(logging.NullHandler())

__version__ = importlib.metadata.version("bailo-artefactscan-api")
