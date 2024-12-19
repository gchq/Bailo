"""Common utilities used by the FastAPI app.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)


def parse_path(path: str | Path | None) -> Path:
    """Ensure that a path is consistently represented as a Path.

    :param path: System path to parse. Defaults to the file's current working directory if unspecified.
    :return: An absolute Path representation of the path parameter.
    """
    logger.debug("Parsing path %s", path)
    if path is None:
        path = "."
    return Path().cwd() if path == "." else Path(path).absolute()


def sanitise_unix_filename(filename: str) -> str:
    """Safely convert an arbitrary string to a valid unix filename by only preserving explicitly allowed characters as per https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
    Note that this is not safe for Windows users as it doesn't check for reserved words e.g. CON and AUX.

    :param filename: the untrusted filename to be sanitised
    :return: a valid filename with trusted characters
    """
    return re.sub(r"[/\\?%*:|\"<>\x7F\x00-\x1F]", "-", filename)


def safe_join(root_dir: str | Path | None, filename: str) -> Path:
    """Combine a trusted directory path with an untrusted filename to get a full path.

    :param root_dir: Trusted path/directory.
    :param filename: Untrusted filename to join to the trusted path. Any path components are stripped off.
    :return: Fully joined path with filename.
    """
    logger.debug("Safely joining path '%s' with filename '%s'", root_dir, filename)

    if not filename or not str(filename).strip():
        raise ValueError("filename must not be empty")

    safe_filename = sanitise_unix_filename(filename).strip()

    if not safe_filename:
        raise ValueError("filename must not be empty")

    parent_dir = parse_path(root_dir).resolve()
    full_path = parent_dir.joinpath(safe_filename).resolve()
    if not full_path.is_relative_to(parent_dir):
        raise ValueError("Could not safely join paths.")

    return full_path
