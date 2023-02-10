from unittest.mock import patch, Mock
import pytest

from bailoclient.model_handlers.model_loader import Loader
from bailoclient.utils.enums import ModelFlavoursMeta
from bailoclient.utils.exceptions import (
    ModelMethodNotAvailable,
    ModelFlavourNotFound,
)


def loader_function(model_path):
    return model_path


def test_load_model_loads_model():
    ModelFlavoursMeta.__contains__ = Mock(return_value=True)

    with patch.dict(Loader.model_loaders, {"flavour": loader_function}, clear=True):
        model_loader = Loader()

        model_path = "path/to/model"

        loaded_model = model_loader.load_model(
            model_path=model_path, model_flavour="flavour"
        )

    assert loaded_model == model_path


def test_load_model_raises_error_if_the_loader_function_has_not_been_implemented():
    ModelFlavoursMeta.__contains__ = Mock(return_value=True)

    with patch.dict(Loader.model_loaders, {}, clear=True):
        model_loader = Loader()

        model_path = "path/to/model"

        with pytest.raises(ModelMethodNotAvailable):
            loaded_model = model_loader.load_model(
                model_path=model_path, model_flavour="flavour"
            )


def test_load_model_raises_error_if_the_flavour_does_not_exit():
    ModelFlavoursMeta.__contains__ = Mock(return_value=False)

    model_loader = Loader()
    model_path = "path/to/model"

    with pytest.raises(ModelFlavourNotFound):
        loaded_model = model_loader.load_model(
            model_path=model_path, model_flavour="flavour"
        )
