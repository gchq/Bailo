"""Bailo client"""

import json
import os
from copy import deepcopy
from typing import Union, List, Optional, Any

from pkg_resources import resource_filename

from bailoclient.client import Client
from bailoclient.config import BailoConfig
from bailoclient.model_handlers import Bundler, Loader
from bailoclient.enums import ModelFlavour


class Bailo(Client):
    """
    Bailo class. This class provides some additional functionality to the Client class.
    """

    def __init__(self, config: Union[os.PathLike, str, BailoConfig]):
        self.bundler = Bundler()
        self.loader = Loader()

        if isinstance(config, (os.PathLike, str)):
            config = BailoConfig.load(config)

        elif not isinstance(config, BailoConfig):
            raise ValueError("The provided config is not valid")

        super().__init__(config=config)

        with open(
            resource_filename("bailoclient", "resources/minimal_metadata.json")
        ) as json_file:
            self._minimal_metadata = json.load(json_file)

        with open(
            resource_filename(
                "bailoclient", "resources/minimal_deployment_metadata.json"
            )
        ) as json_file:
            self._minimal_deployment_metadata = json.load(json_file)

    @property
    def bundlers(self):
        """Get list of available bundler flavours"""
        return list(self.bundler.bundler_functions.keys())

    @property
    def templates(self):
        """Get list of available template flavours"""
        return list(Bundler.model_py_templates.keys())

    @property
    def flavours(self):
        """Get list of available model flavours"""
        return [flavour.value for flavour in ModelFlavour.__members__.values()]

    @property
    def minimal_metadata(self):
        """Get a copy of Bailo's model minimal metadata schema"""
        return deepcopy(self._minimal_metadata)

    @property
    def minimal_deployment_metadata(self):
        """Get a copy of Bailo's deployment minimal metadata schema"""
        return deepcopy(self._minimal_deployment_metadata)

    def bundle_model(
        self,
        output_path: str,
        model: Optional[Any] = None,
        model_binary: Optional[str] = None,
        model_py: Optional[str] = None,
        model_requirements: Optional[str] = None,
        requirements_files_path: Optional[str] = None,
        model_flavour: Optional[str] = None,
        additional_files: Optional[List[str]] = None,
    ):
        """Bundle model files into the required structure for the code.zip and binary.zip
            for uploading to BAILO.

            To save and bundle a model object, provide the model object and the model_flavour.
            You may need to have MLflow installed to use some of the bundlers.

            To bundle a pre-saved model, you will need to provide the model_binary and either the
            model_code or model_flavour as a minimum. If you are not providing model_code, the
            model_flavour is used to get the appropriate model template to bundle with your model.

        Args:
            output_path: Path to output code.zip and binary.zip files to
            model: Model object to save via bundler function. To see available bundlers, see bundlers property Defaults to None.
            model_binary: Path to model binary. Can be a file or directory. Defaults to None.
            model_py: Path to model.py file. If not provided, you must provide a model flavour. To see available templates, use templates property. Defaults to None.
            model_requirements: Path to requirements.txt file OR path to a Python file, module or notebook from which to generate the requirements.txt. Defaults to None.
            requirements_files_path:
            model_flavour: Name of the flavour of model. Supported flavours can be seen with the flavours property. Defaults to None.
            additional_files: List of file paths of additional dependencies or directories of dependencies for the model. Defaults to None.
        """

        output_path = os.path.abspath(output_path)

        if model_binary:
            model_binary = os.path.abspath(model_binary)

        if model_py:
            model_py = os.path.abspath(model_py)

        if model_requirements:
            model_requirements = os.path.abspath(model_requirements)

        if requirements_files_path:
            requirements_files_path = os.path.abspath(requirements_files_path)

        if additional_files:
            additional_files = [os.path.abspath(file) for file in additional_files]

        self.bundler.bundle_model(
            output_path=output_path,
            model=model,
            model_binary=model_binary,
            model_py=model_py,
            model_requirements=model_requirements,
            requirements_files_path=requirements_files_path,
            model_flavour=model_flavour,
            additional_files=additional_files,
        )

    def load_model(self, model_path: str, model_flavour: str):
        """Load a model into memory. You must provide the path to the model file
        and the library that the model was developed with (the model flavour) so
        that the appropriate loader function can be used.

        Args:
            model_path: Path to the actual model file (e.g. './model.pth')
            model_flavour: Flavour of the model (e.g. 'torch')

        Returns:
            Model: The loaded model
        """
        return self.loader.load_model(model_path, model_flavour)

    def generate_requirements_file(self, module_path: str, output_path: str):
        """Generate requirements.txt file based on imports within a Notebook, Python file,
            or Python project. Output_dir must be a directory.

        Args:
            module_path: Path to the Python file used to generate requirements.txt
            output_path: Output path in format output/path
        """

        module_path = os.path.normpath(module_path)
        output_path = os.path.normpath(output_path)

        if not output_path.endswith("requirements.txt"):
            output_path = os.path.join(output_path, "requirements.txt")

        output_dir = os.path.dirname(output_path)

        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        self.bundler.generate_requirements_file(module_path, output_path)
