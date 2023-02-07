from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.XGBOOST)
def xgboost_bundler(model, path: str, code_paths: List[str], pip_requirements: str):
    """Bundle a XGBoost model with MLflow

    Args:
        model (XGBoost model): The XGBoost model
        path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths
        pip_requirements (str): Path to requirements.txt file
    """
    from mlflow.xgboost import save_model

    save_model(
        model, path=path, code_paths=code_paths, pip_requirements=pip_requirements
    )


@loader(flavour=ModelFlavour.XGBOOST)
def xgboost_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for H2O models"
    )


@template(flavour=ModelFlavour.XGBOOST)
def xgboost_template():
    """Get the XGBoost model.py template

    Returns:
        str: Path to XGBoost model.py template
    """
    return resource_filename("bailoclient", "resource/templates/xgboost.py")
