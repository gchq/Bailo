import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.PROPHET)
def prophet_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a Prophet model with MLflow

    Args:
        model (Prophet model): The Prophet model
        output_path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths
    """
    from mlflow.prophet import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.pr")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.PROPHET)
def prophet_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for Prophet models"
    )


@template(flavour=ModelFlavour.PROPHET)
def prophet_template():
    """Get the Prophet model.py template

    Returns:
        str: Path to Prophet model.py template
    """
    return resource_filename("bailoclient", "resources/templates/prophet.py")
