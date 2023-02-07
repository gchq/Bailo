from subprocess import CalledProcessError, SubprocessError
import tempfile
from bailoclient.model_handlers.bundler import Bundler
from bailoclient.utils.exceptions import DirectoryNotFound
from .resources import requirements
import pytest
import os
from importlib_resources import files
from unittest.mock import patch
import subprocess


@pytest.fixture
def bundler():
    return Bundler()


# def test_bundle_model():
#     pass


def test_zip_file_creates_zipfile_at_output_directory_with_one_file(bundler, tmpdir):
    subprocess.run(["touch", f"{tmpdir}/test.txt"])
    subprocess.run(["mkdir", f"{tmpdir}/output"])

    file_path = os.path.join(tmpdir, "test.txt")
    zip_path = os.path.join(tmpdir, "output", "output.zip")

    bundler._Bundler__zip_file(file_path, zip_path)

    assert os.path.exists(zip_path)

    subprocess.run(["unzip", zip_path, "-d", f"{tmpdir}/output"])

    expected_output = os.path.join(tmpdir, "output", "test.txt")
    assert os.path.exists(expected_output)


@patch("bailoclient.bundler.Bundler._Bundler__get_output_dir", return_value="data/")
def test_zip_directory_creates_zipfile_at_the_output_directory(
    mock_output_dir, bundler, tmpdir
):

    # code_dir = tempfile.TemporaryDirectory(dir=tmpdir)
    code_dir = os.path.join(tmpdir, "code_dir")
    subprocess.run(["mkdir", code_dir])
    subprocess.run(["touch", f"{code_dir}/code.txt"])

    code_data_dir = os.path.join(code_dir, "code_data_dir")
    subprocess.run(["mkdir", code_data_dir])
    subprocess.run(["touch", f"{code_data_dir}/data.txt"])

    output_path = os.path.join(tmpdir, "code.zip")

    bundler._Bundler__zip_directory(code_dir, output_path)

    assert os.path.exists(output_path)

    unzip_path = os.path.join(tmpdir, "extracted_code")
    subprocess.run(["mkdir", unzip_path])
    subprocess.run(["unzip", output_path, "-d", unzip_path])

    assert os.path.exists(f"{unzip_path}/data/code.txt")
    assert os.path.exists(f"{unzip_path}/data/data.txt")


def test_get_output_dir_gets_path_relative_to_the_input_directory(bundler):
    file_path = "path/to/code/data"
    dir_path = "path/to/code"

    path = bundler._Bundler__get_output_dir(file_path, dir_path)

    assert path == "data/"


def test_get_output_dir_returns_empty_string_if_paths_are_the_same(bundler):
    file_path = "code"
    dir_path = "code"

    path = bundler._Bundler__get_output_dir(file_path, dir_path)

    assert path == ""


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


def test_generate_requirements_file_raises_error_if_output_directory_does_not_already_exist(
    bundler, tmpdir
):
    python_file = files(requirements).joinpath("file.py")
    output_path = os.path.join(tmpdir, "output/requirements.txt")

    with pytest.raises(DirectoryNotFound):
        bundler.generate_requirements_file(python_file, output_path)


@patch("bailoclient.bundler.subprocess.run", side_effect=SubprocessError)
def test_generate_requirements_file_raises_error_if_subprocess_unexpectedly_fails(
    mock_subprocess_run, bundler, tmpdir
):
    with pytest.raises(SubprocessError):
        bundler.generate_requirements_file("module/path", tmpdir)


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
