import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.SPACY)
def spacy_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a spaCy model with MLflow

    Args:
        model (spaCy model): The spaCy model
        output_path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths
    """
    from mlflow.spacy import save_model

    save_model(model, path=output_path, code_paths=code_paths)

    model_binary = os.path.join(output_path, "data", "model.spacy")
    mlflow_files = [
        os.path.join(output_path, "data", "pickle_module_info.txt"),
        os.path.join(output_path, "MLmodel"),
    ]

    return model_binary, mlflow_files


@loader(flavour=ModelFlavour.SPACY)
def spacy_loader(model_path: str):
    raise ModelMethodNotAvailable(
        "The model loader function has not yet been implemented for spaCy models"
    )


@template(flavour=ModelFlavour.SPACY)
def spacy_template():
    """Get the spaCy model.py template

    Returns:
        str: Path to spaCy model.py template
    """
    return resource_filename("bailoclient", "resources/templates/spacy.py")
