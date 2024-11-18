"""Test for the dependencies.py file.
"""

from __future__ import annotations

import itertools
from pathlib import Path
from typing import Any, Iterable

import pytest

from .dependencies import safe_join


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


def string_path_matrix(path1: str | Path, path2: str | Path) -> itertools.product[tuple[str, Path]]:
    """Wrap type_matrix for convenience with str and Path types.

    :param path1: A path to process.
    :param path2: Another path to process.
    :return: The matrix of both paths with types str and Path.
    """
    return type_matrix([path1, path2], [str, Path])


def helper_test_safe_join(path1: str | Path, path2: str | Path, output: Path) -> None:
    """Helper method for testing that all str and Path representations of the two paths will match the given output when joined.

    :param path1: Directory part of the final path.
    :param path2: Filename part of the final path.
    :param output: Expected final path value.
    """
    for test_dir, test_file in string_path_matrix(path1, path2):
        res = safe_join(test_dir, test_file)
        assert res == output


def helper_test_safe_join_catch(path1: str | Path, path2: str | Path) -> None:
    """Helper method for testing that all str and Path representation of the two paths will throw an error when joined.

    :param path1: Directory part of the final path.
    :param path2: Filename part of the final path.
    """
    # check error thrown given two inputs
    for test_dir, test_file in string_path_matrix(path1, path2):
        with pytest.raises(ValueError):
            safe_join(test_dir, test_file)


# Tests


def test_safe_join_blank():
    helper_test_safe_join("", "foo.bar", Path.cwd().joinpath("foo.bar"))


def test_safe_join_local():
    helper_test_safe_join(".", "foo.bar", Path.cwd().joinpath("foo.bar"))


def test_safe_join_abs():
    helper_test_safe_join("/tmp", "foo.bar", Path("/tmp").joinpath("foo.bar"))


def test_safe_join_abs_trailing():
    helper_test_safe_join("/tmp/", "foo.bar", Path("/tmp").joinpath("foo.bar"))


def test_safe_join_abs_dot():
    helper_test_safe_join("/tmp", ".foo.bar", Path("/tmp").joinpath(".foo.bar"))


def test_safe_join_abs_slash():
    helper_test_safe_join("/tmp", "/foo.bar", Path("/tmp").joinpath("foo.bar"))


def test_safe_join_abs_double_slash():
    helper_test_safe_join("/tmp", "//foo.bar", Path("/tmp").joinpath("foo.bar"))


def test_safe_join_abs_dot_slash():
    helper_test_safe_join("/tmp", "./foo.bar", Path("/tmp").joinpath("foo.bar"))


def test_safe_join_abs_dot_slash_dot():
    helper_test_safe_join("/tmp", "./.foo.bar", Path("/tmp").joinpath(".foo.bar"))


def test_safe_join_abs_double_dot():
    helper_test_safe_join("/tmp", "..foo.bar", Path("/tmp").joinpath("..foo.bar"))


def test_safe_join_abs_double_dot_slash():
    helper_test_safe_join("/tmp", "../foo.bar", Path("/tmp").joinpath("foo.bar"))


def test_safe_join_abs_double_dot_slash_dot():
    helper_test_safe_join("/tmp", "../.foo.bar", Path("/tmp").joinpath(".foo.bar"))


def test_safe_join_fail_blank():
    helper_test_safe_join_catch("/tmp", "")


def test_safe_join_fail_dot():
    helper_test_safe_join_catch("/tmp", ".")


def test_safe_join_fail_double_dot():
    helper_test_safe_join_catch("/tmp", "..")


def test_safe_join_fail_slash():
    helper_test_safe_join_catch("/tmp", "/")


def test_safe_join_fail_double_slash():
    helper_test_safe_join_catch("/tmp", "//")
