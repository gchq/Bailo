from bailoclient.utils.enums import ModelFlavour
from ..bundler import Bundler


def bundler(flavour: ModelFlavour):
    """

    Args:
        flavour (str): Model flavour
    """

    def register_bundler(func):
        Bundler.bundler_functions[flavour.value] = func

    return register_bundler
