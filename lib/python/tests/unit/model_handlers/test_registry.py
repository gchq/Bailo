from unittest.mock import patch
from enum import Enum

from bailoclient.model_handlers import Loader, Bundler
from bailoclient.model_handlers.registry import bundler, loader, template


class mock_enum(Enum):
    TEST = "test_value"


def test_bundler_decorator_adds_function_to_model_bundlers():
    with patch.dict(Bundler.bundler_functions, {}, clear=True):

        @bundler(flavour=mock_enum.TEST)
        def test_bundler():
            pass

        assert Bundler.bundler_functions == {"test_value": test_bundler}


def test_loader_decorator_adds_function_to_model_loaders():
    with patch.dict(Loader.model_loaders, {}, clear=True):

        @loader(flavour=mock_enum.TEST)
        def test_loader():
            pass

        assert Loader.model_loaders == {"test_value": test_loader}


def test_template_decorator_adds_filepath_to_bundler_templates():
    with patch.dict(Bundler.model_py_templates, {}, clear=True):

        @template(flavour=mock_enum.TEST)
        def test_template():
            return "test_path"

        assert Bundler.model_py_templates == {"test_value": "test_path"}
