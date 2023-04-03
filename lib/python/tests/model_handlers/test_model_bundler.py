import subprocess
import pytest
import os

from importlib_resources import files
from unittest.mock import patch, Mock, call
from tests.resources import requirements

from bailoclient.model_handlers.model_bundler import Bundler
from bailoclient.utils.exceptions import (
    ModelFlavourNotFound,
    MissingFilesError,
    ModelTemplateNotAvailable,
    ModelMethodNotAvailable,
)
from bailoclient.utils.enums import ModelFlavoursMeta


@pytest.fixture
def bundler():
    return Bundler()


@patch("bailoclient.model_handlers.model_bundler.Bundler._bundle_model_files")
def test_bundle_model_raises_type_error_if_additional_files_is_not_tuple_or_list(
    mock_bundle_files, bundler
):
    with pytest.raises(TypeError):
        bundler.bundle_model(output_path=".", additional_files="str")

    bundler.bundle_model(output_path=".", additional_files=("file/path",))
    bundler.bundle_model(output_path=".", additional_files=["file/path"])


@patch("bailoclient.model_handlers.model_bundler.Bundler._bundle_model_files")
def test_bundle_model_converts_flavour_to_lower_case(mock_bundle_files, bundler):
    bundler.bundle_model(output_path=".", model_flavour="FLAVOUR")

    mock_bundle_files.assert_called_once_with(
        output_path=".",
        model_binary=None,
        model_py=None,
        model_requirements=None,
        requirements_files_path=None,
        model_flavour="flavour",
        additional_files=None,
    )


@patch("bailoclient.model_handlers.model_bundler.Bundler._save_and_bundle_model_files")
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
def test_bundle_model_files_raises_missing_file_error_if_binary_or_requirements_path_missing(
    binary_path, requirements_path, bundler
):
    with pytest.raises(MissingFilesError):
        bundler._bundle_model_files(
            output_path=".",
            model_binary=binary_path,
            model_py=None,
            model_requirements=requirements_path,
            requirements_files_path=None,
            model_flavour=None,
            additional_files=None,
        )


def test_bundle_model_files_raises_exception_if_no_model_py_provided_and_invalid_or_missing_flavour(
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
            requirements_files_path=None,
            model_flavour=model_flavour,
            additional_files=None,
        )


@patch(
    "bailoclient.model_handlers.model_bundler.Bundler._transfer_and_bundle_model_files"
)
def test_bundle_model_files_identifies_model_template_if_no_model_py(
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
            requirements_files_path=None,
            model_flavour=model_flavour,
            additional_files=None,
        )

    mock_zip_files.assert_called_once_with(
        output_path=output_path,
        model_binary=model_binary,
        model_py=mock_template,
        model_requirements=model_requirements,
        requirements_files_path=None,
        additional_files=None,
    )


def test_save_and_bundle_raises_exception_model_flavour_not_found(bundler):
    ModelFlavoursMeta.__contains__ = Mock(return_value=False)

    with pytest.raises(ModelFlavourNotFound):
        bundler._save_and_bundle_model_files(
            model="", output_path="./", model_flavour="invalid_flavour"
        )


@patch("bailoclient.model_handlers.model_bundler.Bundler._get_model_template")
@patch("bailoclient.model_handlers.model_bundler.Bundler._bundle_model")
@patch(
    "bailoclient.model_handlers.model_bundler.Bundler._transfer_and_bundle_model_files"
)
def test_save_and_bundle_gets_model_py_from_template_if_user_does_not_provide(
    mock_zip_files, mock_bundle_model, mock_get_template, bundler
):
    ModelFlavoursMeta.__contains__ = Mock(return_value=True)
    mock_bundle_model.return_value = ("model/path", "mlflow/files/path")

    bundler._save_and_bundle_model_files(
        output_path="./", model="", model_flavour="flavour"
    )

    mock_get_template.assert_called_once_with("flavour")


@patch.dict(
    "bailoclient.model_handlers.model_bundler.Bundler.model_py_templates",
    {},
    clear=True,
)
def test_get_model_template_raises_exception_if_no_template(bundler):
    with pytest.raises(ModelTemplateNotAvailable):
        bundler._get_model_template("invalid_flavour")


@patch.dict(
    "bailoclient.model_handlers.model_bundler.Bundler.model_py_templates",
    {"torch": "path/to/torch.py"},
    clear=True,
)
def test_get_model_template_returns_path(bundler):
    output = bundler._get_model_template("torch")
    assert output == "path/to/torch.py"


@patch.dict(
    "bailoclient.model_handlers.model_bundler.Bundler.bundler_functions",
    {},
    clear=True,
)
def test_bundle_model_raises_exception_if_bundler_function_not_found(bundler):
    with pytest.raises(ModelMethodNotAvailable):
        bundler._bundle_model("model", "output/path", "flavour")


def test_bundle_model_calls_expected_bundler_function(bundler):
    def bundler_function(model, output_path, code_paths):
        return ("model/", [])

    mock_bundler_function = Mock(side_effect=bundler_function)

    with patch.dict(bundler.bundler_functions, {"flavour": mock_bundler_function}):
        model, additional_files = bundler._bundle_model(
            output_path="output/path", model="model", model_flavour="flavour"
        )

    mock_bundler_function.assert_called_once_with(
        output_path="output/path", model="model", code_paths=None
    )


def test_bundle_model_returns_normalised_paths(bundler):
    def bundler_function(model, output_path, code_paths):
        return ("model/", ["additional_file/"])

    mock_bundler_function = Mock(side_effect=bundler_function)

    with patch.dict(bundler.bundler_functions, {"flavour": mock_bundler_function}):
        model, additional_files = bundler._bundle_model(
            "model", "output/path", "flavour"
        )

    assert model == "model"
    assert "additional_file" in additional_files


import zipfile


def test_zip_file_creates_zipfile_at_output_directory_with_one_file(bundler, tmpdir):
    with open(f"{tmpdir}/test.txt", "w") as f:
        f.write("")

    os.makedirs(os.path.join(tmpdir, "output"))

    file_path = os.path.join(tmpdir, "test.txt")
    zip_path = os.path.join(tmpdir, "output", "output.zip")

    bundler._Bundler__zip_file(file_path, zip_path)

    assert os.path.exists(zip_path)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(f"{tmpdir}/output")

    expected_output = os.path.join(tmpdir, "output", "test.txt")
    assert os.path.exists(expected_output)


@patch("bailoclient.model_handlers.model_bundler.Bundler._copy_model_py")
@patch(
    "bailoclient.model_handlers.model_bundler.Bundler._copy_or_generate_requirements"
)
@patch("bailoclient.model_handlers.model_bundler.Bundler._copy_optional_files")
@patch("bailoclient.model_handlers.model_bundler.Bundler._copy_additional_files")
@patch("bailoclient.model_handlers.model_bundler.Bundler._copy_base_model")
@patch("bailoclient.model_handlers.model_bundler.Bundler.zip_files")
@patch("bailoclient.model_handlers.model_bundler.tempfile.TemporaryDirectory")
def test_transfer_and_bundle_model_files_zips_code_and_binary_folders(
    mock_tmpdir,
    mock_zip_files,
    mock_copy_basemodel,
    mock_copy_additional,
    mock_copy_optional,
    mock_copy_reqs,
    mock_copy_model_py,
    bundler,
    tmpdir,
):
    mock_tmpdir.return_value.__enter__.return_value = tmpdir

    model_binary = "model/binary/path/model.py"
    output_path = "path/to/output/to"

    bundler._transfer_and_bundle_model_files(
        model_binary=model_binary,
        output_path=output_path,
        additional_files=[],
        model_requirements="requirements.txt",
        requirements_files_path="",
        optional_files=[],
        model_py="model.py",
    )

    mock_zip_files.assert_has_calls(
        [
            call(model_binary, os.path.join(output_path, "binary.zip")),
            call(
                os.path.join(tmpdir, "model", "code"),
                os.path.join(output_path, "code.zip"),
            ),
        ]
    )


def test_copy_model_py_copies_file(bundler, tmpdir):
    model_code = os.path.join(tmpdir, "model.py")
    code_path = os.path.join(tmpdir, "model", "code")
    os.makedirs(code_path)

    with open(model_code, "w") as f:
        f.write("")

    assert os.path.exists(model_code)

    bundler._copy_model_py(model_code, code_path)

    assert os.path.exists(os.path.join(code_path, "model.py"))


from pkg_resources import resource_filename


def test_copy_base_model_copies_basemodel_directory(bundler, tmpdir):
    output_path = os.path.join(tmpdir, "basemodel")

    # directory does not yet exist
    assert not os.path.exists(output_path)

    bundler._copy_base_model(output_path)

    # directory created
    assert os.path.exists(output_path)

    # expected files copied
    assert os.path.exists(os.path.join(output_path, "__init__.py"))
    assert os.path.exists(os.path.join(output_path, "basemodel.py"))


@patch("bailoclient.model_handlers.model_bundler.Bundler.generate_requirements_file")
def test_copy_or_generate_requirements_generates_requirements_from_model_py_if_requirements_not_provided(
    mock_generate_reqs, bundler
):
    model_requirements = None
    requirements_files_path = None
    model_code = "code.py"
    code_path = "output/path"

    bundler._copy_or_generate_requirements(
        model_requirements, requirements_files_path, model_code, code_path
    )

    mock_generate_reqs.assert_called_once_with(
        model_code, os.path.join(code_path, "requirements.txt")
    )


@patch("bailoclient.model_handlers.model_bundler.Bundler.generate_requirements_file")
def test_copy_or_generate_requirements_generates_requirements_from_requirements_files_if_not_model_requirements(
    mock_generate_reqs, bundler
):
    model_requirements = None
    requirements_files_path = "requirements/module.py"
    model_code = "code.py"
    code_path = "output/path"

    bundler._copy_or_generate_requirements(
        model_requirements, requirements_files_path, model_code, code_path
    )

    mock_generate_reqs.assert_called_once_with(
        requirements_files_path, os.path.join(code_path, "requirements.txt")
    )


@patch("bailoclient.model_handlers.model_bundler.copyfile")
def test_copy_or_generate_requirements_copies_provided_requirements_if_given(
    mock_copyfile, bundler
):
    model_requirements = "requirements/module.py"
    requirements_files_path = None
    model_code = "code.py"
    code_path = "output/path"

    bundler._copy_or_generate_requirements(
        model_requirements, requirements_files_path, model_code, code_path
    )


@patch("bailoclient.model_handlers.model_bundler.copyfile")
def test_copy_optional_files_copies_files_from_temp_to_specified_location(
    mock_copyfile, bundler
):
    output_path = "output/location"
    optional_files = [
        "/tmp/tmpfolder/optional/filepath/file_1.txt",
        "/tmp/tmpfolder/optional/filepath/file_2.txt",
        "/tmp/tmpfolder/different/filepath/file_3.txt",
    ]

    bundler._copy_optional_files(optional_files, output_path=output_path)

    mock_copyfile.assert_has_calls(
        [
            call(
                "/tmp/tmpfolder/optional/filepath/file_1.txt",
                os.path.join(output_path, "optional", "filepath", "file_1.txt"),
            ),
            call(
                "/tmp/tmpfolder/optional/filepath/file_2.txt",
                os.path.join(output_path, "optional", "filepath", "file_2.txt"),
            ),
            call(
                "/tmp/tmpfolder/different/filepath/file_3.txt",
                os.path.join(output_path, "different", "filepath", "file_3.txt"),
            ),
        ]
    )


@patch(
    "bailoclient.model_handlers.model_bundler.Bundler._Bundler__copy_additional_files_from_tempdir"
)
def test_copy_additional_files_copies_from_tmpdir_if_files_created_in_tmp(
    mock_copy_files_tmp, bundler
):
    additional_files = ["tmp/tmpxyz/files/file.txt"]
    model_binary = "tmp/tmpxyz/model.pth"
    code_path = "tmp/tmpabc/code"

    bundler._copy_additional_files(
        additional_files, model_binary, "tmp/tmpxyz", code_path
    )

    mock_copy_files_tmp.assert_called_once_with(
        additional_files, os.path.join(code_path, "additional_files")
    )


@patch(
    "bailoclient.model_handlers.model_bundler.Bundler._Bundler__copy_additional_files_from_local"
)
def test_copy_additional_files_copies_from_local_if_no_commonpath_with_tmpdir(
    mock_copy_files_local, bundler
):
    additional_files = ["local/path/files/file.txt"]
    model_binary = "local/path/model.pth"
    code_path = "tmp/tmpabc/code"

    bundler._copy_additional_files(
        additional_files, model_binary, "tmp/tmpxyz", code_path
    )

    mock_copy_files_local.assert_called_once_with(
        additional_files, code_path, os.path.dirname(model_binary)
    )


@patch("bailoclient.model_handlers.model_bundler.Path.mkdir")
@patch("bailoclient.model_handlers.model_bundler.copyfile")
def test_copy_additional_files_from_temp_dir(mock_copyfile, mock_mkdir, bundler):
    additional_files = ["tmp/tmpxyz/files/file1.txt", "tmp/tmpxyz/files/file2.txt"]
    output_path = "tmp/tmpxyz/additional_files"

    bundler._Bundler__copy_additional_files_from_tempdir(additional_files, output_path)

    mock_copyfile.assert_has_calls(
        [
            call("tmp/tmpxyz/files/file1.txt", os.path.join(output_path, "file1.txt")),
            call("tmp/tmpxyz/files/file2.txt", os.path.join(output_path, "file2.txt")),
        ]
    )


@patch("bailoclient.model_handlers.model_bundler.os.makedirs")
@patch("bailoclient.model_handlers.model_bundler.copyfile")
def test_copy_additional_files_from_local(mock_copyfile, mock_mkdir, bundler):
    additional_files = ["local/path/files/file1.txt", "local/path/files/file2.txt"]
    output_path = "local/path/model/code/additional_files"
    model_parent_path = "local/path"

    bundler._Bundler__copy_additional_files_from_local(
        additional_files, output_path, model_parent_path
    )

    mock_copyfile.assert_has_calls(
        [
            call(
                "local/path/files/file1.txt",
                os.path.join(output_path, "files", "file1.txt"),
            ),
            call(
                "local/path/files/file2.txt",
                os.path.join(output_path, "files", "file2.txt"),
            ),
        ]
    )


@patch("bailoclient.model_handlers.model_bundler.ZipFile")
def test_zip_file_writes_file_to_zip_at_specified_zip_path(mock_zip_file, bundler):
    mock_zip_file.return_value.__enter__.return_value.write = Mock()

    file_path = "path/to/file.txt"
    zip_path = "path/for/zip"

    bundler._Bundler__zip_file(file_path, zip_path)

    mock_zip_file.return_value.__enter__.return_value.write.assert_called_once_with(
        file_path, arcname="file.txt"
    )


@patch("bailoclient.model_handlers.model_bundler.Bundler._Bundler__get_output_dir")
@patch("bailoclient.model_handlers.model_bundler.ZipFile")
@patch("bailoclient.model_handlers.model_bundler.os.walk")
def test_zip_directory_creates_zipfile_at_the_output_directory(
    mock_os_walk, mock_zip_file, mock_get_output_dir, bundler, tmpdir
):
    code_dir = os.path.join(tmpdir, "code_dir")
    code_data_dir = os.path.join(tmpdir, "code_data_dir")
    output_path = os.path.join(tmpdir, "code.zip")

    def get_output_dir(file_path, dir_path):
        if dir_path == code_dir:
            return "code_dir/"
        elif dir_path == code_data_dir:
            return "code_data_dir/"

    mock_get_output_dir.side_effect = get_output_dir
    mock_zip_file.return_value.__enter__.return_value.write = Mock()
    mock_os_walk.return_value = [
        (code_dir, "unused", ["code.txt"]),
        (code_data_dir, "unused", ["data.txt"]),
    ]

    bundler._Bundler__zip_directory(tmpdir, output_path)

    mock_zip_file.return_value.__enter__.return_value.write.assert_has_calls(
        [
            call(
                filename=os.path.join(code_dir, "code.txt"),
                arcname=os.path.join("code_dir", "code.txt"),
            ),
            call(
                filename=os.path.join(code_data_dir, "data.txt"),
                arcname=os.path.join("code_data_dir", "data.txt"),
            ),
        ],
    )


def test_get_output_dir_gets_path_relative_to_the_input_directory(bundler):
    dir_path = "path/to/code"
    sub_dir_path = "path/to/code/data"

    path = bundler._Bundler__get_output_dir(dir_path, sub_dir_path)

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


@patch(
    "bailoclient.model_handlers.model_bundler.subprocess.run",
    side_effect=subprocess.SubprocessError,
)
def test_generate_requirements_file_raises_error_if_subprocess_unexpectedly_fails(
    mock_subprocess_run, bundler, tmpdir
):
    with pytest.raises(subprocess.SubprocessError):
        bundler.generate_requirements_file("module/path", tmpdir)
