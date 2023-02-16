import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.PYTORCH)
def pytorch_bundler(model, path: str, code_paths: List[str], pip_requirements: str):
    """Bundle a Pytorch model with MLflow

    Args:
        model (Pytorch model): The Pytorch model
        path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths
        pip_requirements (str): Path to requirements.txt file
    """
    from mlflow.pytorch import save_model

    save_model(
        model, path=path, code_paths=code_paths, pip_requirements=pip_requirements
    )

    ## TODO update so returning the mlflow files that we actually want
    return os.path.join(path, "data", "model.pth"), path


@loader(flavour=ModelFlavour.PYTORCH)
def pytorch_loader(model_path: str):
    """Load model with Pytorch

    Args:
        model_path (str): Path to either the model.pth file
                            or the MLflow model directory

    Returns:
        Pytorch model: Loaded Pytorch model
    """

    if os.path.isfile(model_path):
        import torch

        return torch.load(model_path)

    if os.path.isdir(model_path):
        from mlflow.pytorch import load_model

        return load_model(model_path)


@template(flavour=ModelFlavour.PYTORCH)
def pytorch_template():
    """Get the Pytorch model.py template

    Returns:
        str: Path to Pytorch model template
    """
    return resource_filename("bailoclient", "resources/templates/pytorch.py")
