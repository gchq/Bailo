from bailoclient.utils.enums import ModelFlavour
from ..bundler import Bundler


def template(flavour: ModelFlavour):
    def register_template(func):
        Bundler.model_py_templates[flavour.value] = func()

    return register_template
