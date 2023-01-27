from bailoclient.utils.enums import ModelFlavour
from ..bundler import Bundler


def bundler(flavour: ModelFlavour):
    """Bundler decorator for registering a model bundler

    Args:
        flavour (ModelFlavour): Model flavour
    """

    def register_bundler(func):
        """Register the model bundler function to the bundler class

        Args:
            func (Callable): Function to register
        """
        Bundler.bundler_functions[flavour.value] = func

    return register_bundler
