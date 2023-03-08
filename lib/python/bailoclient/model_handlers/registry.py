from bailoclient.utils.enums import ModelFlavour
from .model_bundler import Bundler
from .model_loader import Loader


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

        return func

    return register_bundler


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

        return func

    return register_loader


def template(flavour: ModelFlavour):
    """Template decorator for registering a model template

    Args:
        flavour (ModelFlavour): Model flavour
    """

    def register_template(func):
        """Register the model.py template code to the bundler class

        Args:
            func (Callable): Function to register (function should return template path)
        """
        Bundler.model_py_templates[flavour.value] = func()

        return func()

    return register_template
