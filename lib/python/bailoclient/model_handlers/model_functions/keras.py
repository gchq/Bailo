import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.enums import ModelFlavour
from bailoclient.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.KERAS)
def keras_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a Keras model with MLflow

    Args:
        model (Keras model): The Keras model
        output_path: Path to export the model to
        code_paths: List of additional code paths
    """
    from mlflow.keras import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.h5")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.KERAS)
def keras_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for Keras models"
    )


@template(flavour=ModelFlavour.KERAS)
def keras_template():
    """Get the Keras model.py template

    Returns:
        str: Path to Keras model.py template
    """
    return resource_filename("bailoclient", "resources/templates/keras.py")
