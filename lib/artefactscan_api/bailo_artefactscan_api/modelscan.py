"""Utilities for interacting with ModelScan configuration and artefact validation."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from pickle import UnpicklingError
from pickletools import genops
from typing import Any


def extract_supported_file_types(settings: dict[str, Any]) -> set[str]:
    """
    Extract all supported file extensions from:
    - supported_zip_extensions
    - scanners[*].supported_extensions
    - middlewares[*].formats[*]

    :param settings: modelscan settings config dict to parse
    :return: set of file extensions (lowercase, including leading dot) that modelscan will run on
    """
    supported: set[str] = set()

    supported.update(settings.get("supported_zip_extensions", []) or [])

    scanners = settings.get("scanners") or {}
    if isinstance(scanners, dict):
        for scanner in scanners.values():
            if isinstance(scanner, dict):
                supported.update(scanner.get("supported_extensions", []) or [])

    middlewares = settings.get("middlewares") or {}
    if isinstance(middlewares, dict):
        for middleware in middlewares.values():
            if isinstance(middleware, dict):
                formats = middleware.get("formats") or {}
                if isinstance(formats, dict):
                    for extensions in formats.values():
                        if isinstance(extensions, (list, set, tuple)):
                            supported.update(extensions)

    return {ext.lower() for ext in supported}


def is_valid_pickle(file_path: Path, max_bytes: int = 2 * 1024 * 1024) -> bool:
    """Safely checks if a given file is a valid Pickle file.

    :param file_path: file path to be scanned
    :param max_bytes: maximum number of bytes to read in, defaults to 2*1024*1024
    :return: whether the read bytes are a Pickle file (or not)
    """
    with open(file_path, "rb") as f:
        data = f.read(max_bytes)

    if not data:
        return False

    try:
        # Attempt to iterate through all opcodes
        ops = list(genops(BytesIO(data)))
        if not ops:
            return False
        return True
    except (ValueError, UnpicklingError):
        return False
