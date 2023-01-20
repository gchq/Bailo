
from ..bundler import Bundler

def template(flavour):
    
    def register_template(func):
        Bundler.model_py_templates[flavour] = func()

    return register_template

