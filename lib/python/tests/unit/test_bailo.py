from unittest.mock import patch

import pytest

from bailoclient.bailo import Bailo


@patch("bailoclient.config.BailoConfig.load")
def test_bailo_loads_config_file(patch_load, null_bailo_config):
    patch_load.return_value = null_bailo_config
    Bailo("./config.yaml")
    patch_load.assert_called_once_with("./config.yaml")


def test_bailo_fails_creation_if_incorrect_config_type():
    with pytest.raises(ValueError):
        Bailo(None)


def test_minimal_model_metadata(null_bailo):
    assert null_bailo._minimal_metadata is not None
    assert isinstance(null_bailo._minimal_metadata, dict)


def test_minimal_deployment_metadata(null_bailo):
    assert null_bailo._minimal_deployment_metadata is not None
    assert isinstance(null_bailo._minimal_deployment_metadata, dict)


@patch("bailoclient.bailo.os.path.abspath")
@patch("bailoclient.model_handlers.model_bundler.Bundler.bundle_model")
def test_bundle_model_formats_inputs(patch_bundle_model, patch_abspath, null_bailo):
    def mock_abs_path(path):
        if path.endswith("/"):
            return path[0:-1]
        return path

    patch_abspath.side_effect = mock_abs_path

    output_path = "output_path/"
    model_binary = "model_binary/"
    model_py = "model_py/"
    model_requirements = "model_requirements"
    model_flavour = "pytorch"
    additional_files = ["additional_files/file_1.py", "additional_files/file_2.py"]

    null_bailo.bundle_model(
        output_path=output_path,
        model_binary=model_binary,
        model_py=model_py,
        model_requirements=model_requirements,
        model_flavour=model_flavour,
        additional_files=additional_files,
    )

    patch_bundle_model.assert_called_once_with(
        output_path="output_path",
        model=None,
        model_binary="model_binary",
        model_py="model_py",
        model_requirements=model_requirements,
        requirements_files_path=None,
        model_flavour=model_flavour,
        additional_files=additional_files,
    )

    assert patch_abspath.call_count == 6


@patch("bailoclient.bailo.os.makedirs")
@patch("bailoclient.bailo.os.path.exists", return_value=False)
@patch("bailoclient.model_handlers.model_bundler.Bundler.generate_requirements_file")
def test_generate_requirements_file_formats_inputs_and_creates_output_directory_if_it_does_not_exist(
    patch_generate_requirements_file, patch_exists, patch_makedirs, null_bailo
):
    module_path = "/path/"
    output_path = "./output/somewhere"

    null_bailo.generate_requirements_file(module_path, output_path)

    expected_output_dir = "output/somewhere"
    expected_module_path = "/path"
    expected_output_path = "output/somewhere/requirements.txt"

    patch_makedirs.assert_called_once_with(expected_output_dir, exist_ok=True)
    patch_generate_requirements_file.assert_called_once_with(
        expected_module_path, expected_output_path
    )
