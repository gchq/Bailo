import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.FASTAI)
def fastai_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a fast.ai model with MLflow

    Args:
        model (fast.ai model): The fast.ai model
        output_path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths

    Returns:
        Tuple(str, List[str]): Path to saved model binary, paths to additional MLflow files to
                                bundle with the model files.
    """
    from mlflow.fastai import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.fastai")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.FASTAI)
def fastai_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for fast.ai models"
    )


@template(flavour=ModelFlavour.FASTAI)
def fastai_template():
    """Get the fast.ai model.py template

    Returns:
        str: Path to fast.ai model.py template
    """
    return resource_filename("bailoclient", "resources/templates/fastai.py")
