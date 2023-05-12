import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.enums import ModelFlavour
from bailoclient.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.STATSMODELS)
def statsmodels_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a statsmodels model with MLflow

    Args:
        model (statsmodels model): The statsmodels model
        output_path: Path to export the model to
        code_paths: List of additional code paths
    """
    from mlflow.statsmodels import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.statsmodels")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.STATSMODELS)
def statsmodels_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for statsmodels models"
    )


@template(flavour=ModelFlavour.STATSMODELS)
def statsmodels_template():
    """Get the statsmodels model.py template

    Returns:
        str: Path to statsmodels model.py template
    """
    return resource_filename("bailoclient", "resources/templates/statsmodels.py")
