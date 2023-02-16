import subprocess
import tempfile
import pytest
import os

from importlib_resources import files
from unittest.mock import patch, Mock
from tests.resources import requirements

from bailoclient.model_handlers.model_bundler import Bundler
from bailoclient.utils.exceptions import (
    DirectoryNotFound,
    ModelFlavourNotFound,
    MissingFilesError,
)
from bailoclient.utils.enums import ModelFlavoursMeta, ModelFlavour


@pytest.fixture
def bundler():
    return Bundler()


@patch(
    "bailoclient.model_handlers.model_bundler.Bundler.format_directory_path",
    return_value="./",
)
@patch("bailoclient.model_handlers.model_bundler.Bundler._bundle_model_files")
def test_bundle_model_raises_type_error_if_additional_files_is_not_tuple_or_list(
    mock_bundle_files, mock_format_dir, bundler
):
    with pytest.raises(TypeError):
        bundler.bundle_model(output_path=".", additional_files="str")

    bundler.bundle_model(output_path=".", additional_files=("file/path",))
    bundler.bundle_model(output_path=".", additional_files=["file/path"])


@patch(
    "bailoclient.model_handlers.model_bundler.Bundler.format_directory_path",
    return_value="./",
)
@patch("bailoclient.model_handlers.model_bundler.Bundler._bundle_model_files")
def test_bundle_model_converts_flavour_to_lower_case(
    mock_bundle_files, mock_format_dir, bundler
):
    bundler.bundle_model(output_path=".", model_flavour="FLAVOUR")

    mock_bundle_files.assert_called_with("./", None, None, None, "flavour", None)


@patch("bailoclient.model_handlers.model_bundler.Bundler._bundle_with_mlflow")
def test_bundle_model_does_mlflow_bundling_if_actual_model_file_provided(
    mock_mlflow_bundling,
    bundler,
):
    model, model_flavour = "model", "invalid_flavour"
    output_path = "."

    ModelFlavoursMeta.__contains__ = Mock(return_value=False)

    bundler.bundle_model(
        output_path=output_path, model=model, model_flavour=model_flavour
    )

    mock_mlflow_bundling.assert_called_once()


@patch("bailoclient.model_handlers.model_bundler.Bundler._bundle_model_files")
def test_bundle_model_bundles_files_if_no_actual_model_file_provided(
    mock_bundle_model_files,
    bundler,
):
    model, model_flavour = "model", "invalid_flavour"
    output_path = "."

    ModelFlavoursMeta.__contains__ = Mock(return_value=False)

    bundler.bundle_model(output_path=output_path)

    mock_bundle_model_files.assert_called_once()


@pytest.mark.parametrize(
    "binary_path, requirements_path",
    [
        (None, "requirements"),
        ("binary", None),
    ],
)
def test_do_model_bundling_raises_missing_file_error_if_binary_or_requirements_path_missing(
    binary_path, requirements_path, bundler
):
    with pytest.raises(MissingFilesError):
        bundler._bundle_model_files(
            output_path=".",
            model_binary=binary_path,
            model_py=None,
            model_requirements=requirements_path,
            model_flavour=None,
            additional_files=None,
        )


def test_do_model_bundling_raises_exception_if_no_model_py_provided_and_invalid_or_missing_flavour(
    bundler,
):
    model_binary, model_requirements, model_flavour = (
        "binary/path",
        "requirements/path",
        "invalid_flavour",
    )
    output_path = "."

    ModelFlavoursMeta.__contains__ = Mock(return_value=False)

    with pytest.raises(ModelFlavourNotFound):
        bundler._bundle_model_files(
            output_path=output_path,
            model_binary=model_binary,
            model_py=None,
            model_requirements=model_requirements,
            model_flavour=model_flavour,
            additional_files=None,
        )


@patch("bailoclient.model_handlers.model_bundler.Bundler.zip_model_files")
def test_do_model_bundling_identifies_model_template_if_no_model_py(
    mock_zip_files, bundler
):
    model_binary, model_requirements, model_flavour = (
        "binary/path",
        "requirements/path",
        "flavour",
    )
    output_path = "."

    mock_template = "returned template"
    ModelFlavoursMeta.__contains__ = Mock(return_value=True)

    with patch.dict(Bundler.model_py_templates, {"flavour": mock_template}):
        bundler._bundle_model_files(
            output_path=output_path,
            model_binary=model_binary,
            model_py=None,
            model_requirements=model_requirements,
            model_flavour=model_flavour,
            additional_files=None,
        )

    mock_zip_files.assert_called_once_with(
        mock_template, model_requirements, None, model_binary, output_path
    )


## TODO this mock isn't working
def test_mlflow_bundling_raises_exception_model_flavour_not_found(bundler):
    ModelFlavoursMeta.__contains__ = Mock(return_value=True)

    with pytest.raises(ModelFlavourNotFound):
        bundler._bundle_with_mlflow(
            model="", output_path="./", model_flavour="invalid_flavour"
        )


def test_mflow_bundling(bundler):
    # print(ModelFlavour)
    # print("torch" in ModelFlavour)
    # print("flavour" in ModelFlavour)
    ModelFlavoursMeta.__contains__ = Mock(return_value=True)
    # print("flavour" in ModelFlavour)

    bundler._bundle_with_mlflow(model="", output_path="./", model_flavour="flavour")
    assert 1 == 2


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


@patch(
    "bailoclient.model_handlers.model_bundler.Bundler._Bundler__get_output_dir",
    return_value="data/",
)
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


@patch(
    "bailoclient.model_handlers.model_bundler.subprocess.run",
    side_effect=subprocess.SubprocessError,
)
def test_generate_requirements_file_raises_error_if_subprocess_unexpectedly_fails(
    mock_subprocess_run, bundler, tmpdir
):
    with pytest.raises(subprocess.SubprocessError):
        bundler.generate_requirements_file("module/path", tmpdir)


def test_create_dir_makes_new_directory_from_dir_path(bundler, tmpdir):
    output_dir = os.path.join(tmpdir, "test")

    bundler.create_dir(output_dir=output_dir)

    assert os.path.exists(os.path.join(tmpdir, "test"))


def test_create_dir_errors_if_directory_not_valid(bundler, tmpdir):
    test_name = "\0"
    output_dir = os.path.join(tmpdir, test_name)

    with pytest.raises(subprocess.SubprocessError):
        bundler.create_dir(output_dir=output_dir)


def test_format_directory_path_adds_trailing_slash_if_not_present(bundler):
    dir_path = "test/path"
    new_dir_path = bundler.format_directory_path(dir_path)

    assert new_dir_path == dir_path + os.path.sep


def test_format_directory_path_does_nothing_if_trailing_slash_present(bundler):
    dir_path = "test/path/"
    new_dir_path = bundler.format_directory_path(dir_path)

    assert new_dir_path == dir_path
