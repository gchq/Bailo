import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.enums import ModelFlavour
from bailoclient.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.GLUON)
def gluon_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a Gluon model with MLflow

    Args:
        model (Gluon model): The Gluon model
        output_path: Path to export the model to
        code_paths: List of additional code paths

    Returns:
        Tuple(str, List[str]): Path to saved model binary, paths to additional MLflow files to
                                bundle with the model files.
    """
    from mlflow.gluon import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "data.net")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.GLUON)
def gluon_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for Gluon models"
    )


@template(flavour=ModelFlavour.GLUON)
def gluon_template():
    """Get the Gluon model.py template

    Returns:
        str: Path to Gluon model.py template
    """
    return resource_filename("bailoclient", "resources/templates/gluon.py")
