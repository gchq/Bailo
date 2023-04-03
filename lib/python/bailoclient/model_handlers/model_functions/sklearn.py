import os
from typing import List
from pkg_resources import resource_filename

from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import ModelMethodNotAvailable
from bailoclient.model_handlers import bundler, loader, template


@bundler(flavour=ModelFlavour.SKLEARN)
def sklearn_bundler(model, output_path: str, code_paths: List[str]):
    """Bundle a sklearn model with MLflow

    Args:
        model (sklearn model): The sklearn model
        output_path (str): Path to export the model to
        code_paths (List[str]): List of additional code paths
    """
    model_binary = os.path.join(output_path, "model.pkl")

    try:
        from mlflow.sklearn import save_model

        save_model(model, path=output_path, code_paths=code_paths)

        mlflow_files = [
            os.path.join(output_path, "MLmodel"),
        ]

        return model_binary, mlflow_files

    except ModuleNotFoundError:
        import pickle

        os.makedirs(f"{output_path}", exist_ok=True)

        with open(model_binary, "wb") as f:
            pickle.dump(model, f)

        return (model_binary, [])


@loader(flavour=ModelFlavour.SKLEARN)
def sklearn_loader(model_path: str):
    import pickle

    with open(model_path, "rb") as model_file:
        return pickle.load(model_file)


@template(flavour=ModelFlavour.SKLEARN)
def sklearn_template():
    """Get the sklearn model.py template

    Returns:
        str: Path to sklearn model.py template
    """
    return resource_filename("bailoclient", "resources/templates/sklearn.py")
