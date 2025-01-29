"""Test for the dependencies.py file.
"""

from __future__ import annotations

import itertools
from collections.abc import Iterable
from pathlib import Path
from typing import Any

import pytest

# isort: split

from bailo_modelscan_api.dependencies import parse_path, safe_join, sanitise_unix_filename

# Helpers


def type_matrix(data: Iterable[Any], types: Iterable[type]) -> itertools.product[tuple[Any, ...]]:
    """Generate a matrix of all combinations of `data` converted to each type in `types`.
    For example:
    `list(type_matrix(["foo", "bar"], [str, Path])) -> [(str(foo), str(bar)), (str(foo), Path(bar)), (Path(foo), str(bar)), (Path(foo), Path(bar))]`

    :param data: The data to be converted.
    :param types: The types to convert each item of data to.
    :return: The resulting matrix of combinations.
    """
    return itertools.product(*[[t(d) for t in types] for d in data])


# Tests


@pytest.mark.parametrize(
    ("path", "output"),
    [
        ("foo.bar", "foo.bar"),
        (".foo.bar", ".foo.bar"),
        ("/foo.bar", "-foo.bar"),
        ("foo/./bar", "foo-.-bar"),
        ("foo.-/bar", "foo.--bar"),
        (".", "."),
        ("..", ".."),
        ("/", "-"),
        ("/.", "-."),
        ("./", ".-"),
        ("\n", "-"),
        ("\r", "-"),
        ("~", "~"),
        (
            "".join(['\\[/\\?%*:|"<>0x7F0x00-0x1F]', chr(0x1F) * 15]),
            "-[----------0x7F0x00-0x1F]---------------",
        ),
        ("ad\nbla'{-+\\)(ç?", "ad-bla'{-+-)(ç-"),
    ],
)
def test_sanitise_unix_filename(path: str, output: str) -> None:
    assert sanitise_unix_filename(path) == output


@pytest.mark.parametrize(
    ("path", "output"),
    [
        (None, Path().cwd()),
        ("", Path().cwd()),
        (".", Path().cwd()),
        ("/tmp", Path("/tmp")),
        ("/foo/bar", Path("/foo/bar")),
        ("/foo/../bar", Path("/foo/../bar")),
        ("/foo/bar space/baz", Path("/foo/bar space/baz")),
        ("/C:\\Program Files\\HAL 9000", Path("/C:\\Program Files\\HAL 9000")),
        ("/ISO&Emulator", Path("/ISO&Emulator")),
        ("/$HOME", Path("/$HOME")),
        ("~", Path().cwd().joinpath("~")),
    ],
)
def test_parse_path(path: str | Path | None, output: Path) -> None:
    if path is None:
        assert parse_path(path) == output
    else:
        for (test_path,) in type_matrix((path,), (str, Path)):
            assert parse_path(test_path) == output


@pytest.mark.parametrize(
    ("path1", "path2", "output"),
    [
        ("", "foo.bar", Path.cwd().joinpath("foo.bar")),
        (".", "foo.bar", Path.cwd().joinpath("foo.bar")),
        ("/tmp", "foo.bar", Path("/tmp/foo.bar")),
        ("/tmp/", "foo.bar", Path("/tmp/foo.bar")),
        ("/tmp/", "/foo.bar", Path("/tmp/-foo.bar")),
        ("/tmp", ".foo.bar", Path("/tmp/.foo.bar")),
        ("/tmp", "/foo.bar", Path("/tmp/-foo.bar")),
        ("/tmp", "//foo.bar", Path("/tmp/--foo.bar")),
        ("/tmp", "./foo.bar", Path("/tmp/.-foo.bar")),
        ("/tmp", "./.foo.bar", Path("/tmp/.-.foo.bar")),
        ("/tmp", "..foo.bar", Path("/tmp/..foo.bar")),
        ("/tmp", "../foo.bar", Path("/tmp/..-foo.bar")),
        ("/tmp", "../.foo.bar", Path("/tmp/..-.foo.bar")),
        ("/tmp", ".", Path("/tmp/.")),
        ("/tmp", "/", Path("/tmp/-")),
        ("/tmp", "//", Path("/tmp/--")),
        ("/tmp", "~", Path("/tmp/~")),
    ],
)
def test_safe_join(path1: str | Path, path2: str, output: Path) -> None:
    """Test that all str and Path representations of the two paths will match the given output when joined.

    :param path1: Directory part of the final path.
    :param path2: Filename part of the final path.
    :param output: Expected final path value.
    """
    for (test_dir,) in type_matrix((path1,), (str, Path)):
        res = safe_join(test_dir, path2)
        assert res == output


@pytest.mark.parametrize(("path1", "path2"), [("/tmp", ""), ("/tmp", "..")])
def test_safe_join_catch(path1: str | Path, path2: str) -> None:
    """Test that all str and Path representation of the two paths will throw an error when joined.

    :param path1: Directory part of the final path.
    :param path2: Filename part of the final path.
    """
    # check error thrown given two inputs
    for (test_dir,) in type_matrix((path1,), (str, Path)):
        with pytest.raises(ValueError):
            safe_join(test_dir, path2)
