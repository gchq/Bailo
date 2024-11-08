"""Common utilities used by the FastAPI app.
"""

from pathlib import Path
from typing import Union
from requests import Response


class ResponsePath:

    def __init__(self, response: Response, path: Path) -> None:
        self.response = response
        self.path = path


def parse_path(path: Union[str, Path, None]) -> Path:
    """Ensure that a path is consistently represented as a Path.

    :param path: System path to parse. Defaults to the file's current working directory if unspecified.
    :return: An absolute Path representation of the path parameter.
    """
    if path is None:
        path = "."
    return Path().cwd() if path == "." else Path(path).absolute()
