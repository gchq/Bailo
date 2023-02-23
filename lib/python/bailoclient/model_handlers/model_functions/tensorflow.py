import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.TENSORFLOW)
def tensorflow_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a TensorFlow model with MLflow

    Args:
        model (TensorFlow model): The TensorFlow model
        output_path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths
    """
    from mlflow.tensorflow import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.TENSORFLOW)
def tensorflow_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for TensorFlow models"
    )


@template(flavour=ModelFlavour.TENSORFLOW)
def tensorflow_template():
    """Get the TensorFlow model.py template

    Returns:
        str: Path to TensorFlow model.py template
    """
    return resource_filename("bailoclient", "resources/templates/tensorflow.py")
