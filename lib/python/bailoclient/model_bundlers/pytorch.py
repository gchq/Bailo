from pkg_resources import resource_filename

from bailoclient.registries import bundler, loader, template


@bundler(flavour="pytorch")
def pytorch_bundler(model, path, code_paths, pip_requirements):
    from mlflow.pytorch import save_model

    save_model(model, path, code_paths, pip_requirements)


@loader(flavour="pytorch")
def pytorch_loader(model_path):
    import torch

    return torch.load(model_path)


@template(flavour="pytorch")
def pytorch_template():
    return resource_filename("bailoclient", "resources/templates/pytorch.py")
