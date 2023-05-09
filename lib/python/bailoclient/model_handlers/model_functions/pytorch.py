import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.enums import ModelFlavour
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.PYTORCH)
def pytorch_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a Pytorch model with MLflow

    Args:
        model (Pytorch model): The Pytorch model
        output_path: Path to export the model to
        code_paths: List of additional code paths

    Returns:
        Tuple(str, List[str]): Path to saved model binary, paths to additional MLflow files to
                                bundle with the model files.
    """
    from mlflow.pytorch import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.pth")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


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
