
from ..bundler import Bundler

def bundler(flavour):
    
    def register_bundler(func):
        Bundler.bundler_functions[flavour] = func

    return register_bundler

