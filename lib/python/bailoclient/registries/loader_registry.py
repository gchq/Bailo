from bailoclient.utils.enums import ModelFlavour
from ..loader import Loader


def loader(flavour: ModelFlavour):
    def register_loader(func):
        Loader.model_loaders[flavour.value] = func

    return register_loader
