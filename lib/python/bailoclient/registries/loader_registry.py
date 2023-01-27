from bailoclient.utils.enums import ModelFlavour
from ..loader import Loader


def loader(flavour: ModelFlavour):
    """Loader decorator for registering a model loader

    Args:
        flavour (ModelFlavour): Model flavour
    """

    def register_loader(func):
        """Register the model loader function to the loader class

        Args:
            func (Callable): Function to register
        """
        Loader.model_loaders[flavour.value] = func

    return register_loader
