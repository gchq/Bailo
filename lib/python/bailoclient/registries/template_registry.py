from bailoclient.utils.enums import ModelFlavour
from ..bundler import Bundler


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

    return register_template
