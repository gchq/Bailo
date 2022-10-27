from subprocess import SubprocessError
from tempfile import tempdir
from bailoclient.bundler import Bundler
from bailoclient.utils.exceptions import DirectoryNotFound
from .resources import requirements
import pytest
import os
from importlib_resources import files


@pytest.fixture
def bundler():
    return Bundler()


# def test_bundle_model():
#     pass


def test_generate_requirements_file_creates_requirements_file_at_filepath(
    bundler, tmpdir
):
    python_file = files(requirements).joinpath("file.py")
    output_path = os.path.join(tmpdir, "requirements.txt")

    bundler.generate_requirements_file(python_file, output_path)

    assert os.path.exists(output_path)

    with open(output_path, "r") as f:
        content = f.read()

    assert "pydantic" in content
    assert "requests" in content


def test_generate_requirements_file_raises_error_if_subprocess_fails(bundler, tmpdir):
    python_file = files(requirements).joinpath("file.py")
    output_path = os.path.join(tmpdir, "output/requirements.txt")

    with pytest.raises(DirectoryNotFound):
        bundler.generate_requirements_file(python_file, output_path)


def test_create_dir_makes_new_directory_from_dir_path(bundler, tmpdir):
    output_dir = os.path.join(tmpdir, "test")

    bundler.create_dir(output_dir=output_dir)

    assert os.path.exists(os.path.join(tmpdir, "test"))


def test_create_dir_errors_if_directory_not_valid(bundler, tmpdir):
    test_name = "\0"
    output_dir = os.path.join(tmpdir, test_name)

    with pytest.raises(SubprocessError):
        bundler.create_dir(output_dir=output_dir)


def test_format_directory_path_adds_trailing_slash_if_not_present(bundler):
    dir_path = "test/path"
    new_dir_path = bundler.format_directory_path(dir_path)

    assert new_dir_path == dir_path + os.path.sep


def test_format_directory_path_does_nothing_if_trailing_slash_present(bundler):
    dir_path = "test/path/"
    new_dir_path = bundler.format_directory_path(dir_path)

    assert new_dir_path == dir_path
