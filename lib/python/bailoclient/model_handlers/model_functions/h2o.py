import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.enums import ModelFlavour
from bailoclient.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.H2O)
def h2o_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle an H2O model with MLflow

    Args:
        model (H2O model): The H2O model
        output_path: Path to export the model to
        code_paths: List of additional code paths

    Returns:
        Tuple(str, List[str]): Path to saved model binary, paths to additional MLflow files to
                                bundle with the model files.
    """
    from mlflow.h2o import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.h2o")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.H2O)
def h2o_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for H2O models"
    )


@template(flavour=ModelFlavour.H2O)
def h2o_template():
    """Get the H2O model.py template

    Returns:
        str: Path to H2O model.py template
    """
    return resource_filename("bailoclient", "resources/templates/h2o.py")
