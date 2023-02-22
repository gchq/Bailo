import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.CATBOOST)
def catboost_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a CatBoost model with MLflow

    Args:
        model (catboost model): The CatBoost model
        output_path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths

    Returns:
        Tuple(str, List[str]): Path to saved model binary, paths to additional MLflow files to
                                bundle with the model files.
    """
    from mlflow.catboost import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.cb")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.CATBOOST)
def catboost_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for CatBoost models"
    )


@template(flavour=ModelFlavour.CATBOOST)
def catboost_template():
    """Get the CatBoost model.py template

    Returns:
        str: Path to CatBoost model.py template
    """
    return resource_filename("bailoclient", "resources/templates/catboost.py")
