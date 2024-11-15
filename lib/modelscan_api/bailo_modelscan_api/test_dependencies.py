"""Test for the main.py file.
"""

import itertools
from pathlib import Path

import pytest

from .dependencies import safe_join


# Helpers


def string_path_matrix(path1, path2):
    # List of pairs of paths, as a str and Path representation of each.
    return itertools.product(*[[str(x), Path(x)] for x in [path1, path2]])


def helper_test_safe_join(path1, path2, output):
    # check expected output given 2 inputs
    for test_dir, test_file in string_path_matrix(path1, path2):
        res = safe_join(test_dir, test_file)
        assert res == output


def helper_test_safe_join_catch(path1, path2):
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
