from pathlib import Path
from typing import Union
from requests import Response


class ResponsePath:

    def __init__(self, response: Response, path: Path) -> None:
        self.response = response
        self.path = path


def parse_path(path: Union[str, Path, None]) -> Path:
    if path is None:
        path = "."
    return Path().cwd() if path == "." else Path(path).absolute()
