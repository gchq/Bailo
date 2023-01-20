from ..loader import Loader


def loader(flavour):
    def register_loader(func):
        Loader.model_loaders[flavour] = func

    return register_loader
