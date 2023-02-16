import tempfile
import subprocess
import os
from pathlib import Path
from glob import glob
from zipfile import ZipFile
from typing import List
from shutil import copyfile

from ..utils.enums import ModelFlavour
from bailoclient.utils.exceptions import (
    ModelFlavourNotFound,
    ModelTemplateNotAvailable,
    DirectoryNotFound,
    MissingFilesError,
    ModelMethodNotAvailable,
)


class Bundler:
    """Class for handling model bundling"""

    bundler_functions = {}
    model_py_templates = {}

    def bundle_model(
        self,
        output_path: str,
        model=None,
        model_binary: str = None,
        model_py: str = None,
        model_requirements: str = None,
        model_flavour: str = None,
        additional_files: List[str] = None,
    ):
        """Bundle model files into the required structure for the code.zip and binary.zip
            for uploading to BAILO.

            To save and bundle a model object, provide the model object and the model_flavour.
            Model bundling will be done using Mlflow, which you will need to have installed
            in your environment.

            To bundle a pre-saved model, you will need to provide the model_binary as a minimum.
            If you are not providing model_code you will need to provide a model_flavour so that
            the appropriate model template can be bundled with your model.

        Args:
            output_path (str): Output path for code and binary zips
            model (any, optional): Model object to save via Mlflow. Must be one of
                                    the formats supported by Mlflow.
                                    See https://www.mlflow.org/docs/latest/models.html#built-in-model-flavors
                                    Defaults to None.
            model_binary (str, optional): Path to model binary. Can be a file or directory. Defaults to None.
            model_py (str, optional): Path to model.py file. If not provided, you must provide
                                        a model flavour. Defaults to None.
            model_requirements (str, optional): Path to requirements.txt file OR path to a Python file,
                                                module or notebook from which to generate the
                                                requirements.txt. Defaults to None.
            model_flavour (str, optional): Name of the flavour of model. Supported flavours are
                                            those provided by MLflow. Defaults to None.
            additional_files (list[str], optional): List or tuple of file paths of additional dependencies
                                                    or directories of dependencies for the model.
                                                    Defaults to None.
        """

        if not os.path.exists(output_path):
            Path(output_path).mkdir(parents=True)

        output_path = os.path.abspath(output_path)

        if additional_files and not isinstance(additional_files, (tuple, list)):
            raise TypeError("Expected additional_files to be a list of file paths")

        if model_flavour:
            model_flavour = model_flavour.lower()

        if model:
            return self._save_and_bundle_model_files(
                model,
                output_path,
                model_flavour,
                additional_files,
                model_requirements,
                model_py,
            )

        return self._bundle_model_files(
            output_path,
            model_binary,
            model_py,
            model_requirements,
            model_flavour,
            additional_files,
        )

    def _bundle_model_files(
        self,
        output_path: str,
        model_binary: str,
        model_py: str,
        model_requirements: str,
        model_flavour: str,
        additional_files: List[str],
    ):
        if not model_binary:
            raise MissingFilesError(
                "Must provide model binary or model object and flavour"
            )

        if not model_requirements:
            raise MissingFilesError(
                "Provide either path to requirements.txt or your python file/notebook/module to generate requirements.txt"
            )

        if not model_py and model_flavour not in ModelFlavour:
            raise ModelFlavourNotFound(
                "A valid model flavour must be provided to generate the model.py file"
            )

        if not model_py:
            model_py = self._get_model_template(model_flavour)

        return self.zip_model_files(
            model_py, model_requirements, additional_files, model_binary, output_path
        )

    def _save_and_bundle_model_files(
        self,
        model,
        output_path: str,
        model_flavour: str,
        additional_files: List[str] = None,
        model_requirements: str = None,
        model_py: str = None,
    ):
        """Bundle model files via MLflow. Accepts models in 'flavors' that are supported
            by MLflow.

        Args:
            model (any): Model object in a format supported by MLflow
            output_path (str): Output path to save model files to
            model_flavour (str): Model flavour. Must be supported by MLflow
            additional_files (List[str], optional): List of additional files to include as
                                                    dependencies. Defaults to None.
            model_requirements (str, optional): Model requirements.txt file. Will be generated
                                                by MLflow if not provided. Defaults to None.
            model_py (str, optional): Path to model.py file. Will use the template for the
                                        model flavour if not provided. Defaults to None.

        Raises:
            TemplateNotAvailable: MLeap models do not have an available template
            ModelFlavourNotRecognised: The provided model flavour was not recognised
        """

        if model_flavour not in ModelFlavour:
            raise ModelFlavourNotFound("Invalid model flavour")

        if not model_py:
            model_py = self._get_model_template(model_flavour)

        tmpdir = tempfile.TemporaryDirectory()

        ## TODO update this to return the model path and optionally additional mlflow files (conda reqs, mlflow file for importing etc)
        self._bundle_model(
            model, tmpdir.name, model_flavour, additional_files, model_requirements
        )

        # TODO then remove this
        model_binary = glob(f"{tmpdir.name}/data/model*")[0]

        self.zip_model_files(
            model_py,
            model_requirements,
            additional_files,
            model_binary,
            output_path,
        )

        tmpdir.cleanup()

    def _get_model_template(self, model_flavour: str):
        try:
            return self.model_py_templates[model_flavour]

        except:
            raise ModelTemplateNotAvailable(
                f"There is no model template available for {model_flavour}"
            )

    def _bundle_model(
        self,
        model,
        output_path: str,
        model_flavour: str,
        additional_files: List[str] = None,
        model_requirements: str = None,
    ):
        try:
            bundler_function = self.bundler_functions[model_flavour]

        except KeyError:
            raise ModelMethodNotAvailable(
                f"Bundler function does not exist for {model_flavour}"
            ) from None

        bundler_function(
            model=model,
            path=output_path,
            code_paths=additional_files,
            pip_requirements=model_requirements,
        )

    def __contains_required_code_files(self, code_dir: str):
        """Check that a directory of model code contains requirements.txt and model.py files

        Args:
            code_dir (str): Path of code directory

        Returns:
            boolean: True if required files found
        """
        code_files = [
            file.lower() for _, _, files in os.walk(code_dir) for file in files
        ]
        return "requirements.txt" in code_files and "model.py" in code_files

    def zip_model_files(
        self,
        model_code: str,
        model_requirements: str,
        additional_files: str,
        model_binary: str,
        output_path: str,
    ):
        """Create code.zip and binary.zip of provoded model files at output path.
            Copies all files to a tempdir in the format expected by BAILO.

        Args:
            model_code (str): Path to model.py file
            model_requirements (str): Path of requirements.txt file
            additional_files (List[str]): List of paths of any additional required files
            model_binary (str): Path of model binary
            output_path (str): Path to create the code.zip and binary.zip files
        """

        # standardise all the paths
        model_binary = os.path.abspath(model_binary)
        model_code = os.path.abspath(model_code)
        model_requirements = os.path.abspath(model_requirements)
        additional_files = [os.path.abspath(file) for file in additional_files]

        with tempfile.TemporaryDirectory() as tmpdir_name:
            code_path = os.path.join(tmpdir_name, "model", "code")
            Path(code_path).mkdir(parents=True)

            self._copy_or_generate_requirements(
                model_requirements, model_code, code_path
            )

            if additional_files:
                self._copy_additional_files(
                    additional_files, model_binary, tempfile.gettempdir(), code_path
                )

            copyfile(model_code, os.path.join(code_path, "model.py"))
            copyfile(
                model_binary,
                os.path.join(tmpdir_name, "model", os.path.basename(model_binary)),
            )

            # create zips
            self.zip_files(model_binary, f"{output_path}/binary.zip")
            self.zip_files(code_path, f"{output_path}/code.zip")

    def _copy_or_generate_requirements(self, model_requirements, model_code, code_path):
        if not model_requirements:
            self.generate_requirements_file(
                model_code, os.path.join(code_path, "requirements.txt")
            )

        elif not model_requirements.endswith("requirements.txt"):
            self.generate_requirements_file(
                model_requirements, os.path.join(code_path, "requirements.txt")
            )

        else:
            copyfile(model_requirements, os.path.join(code_path, "requirements.txt"))

    def _copy_additional_files(
        self, additional_files, model_binary, temp_dir, code_path
    ):
        if os.path.commonpath([model_binary, temp_dir]) == temp_dir:
            self.__copy_additional_files_from_tempdir(
                additional_files, os.path.join(code_path, "additional_files")
            )

        else:
            self.__copy_additional_files_from_local(
                additional_files,
                code_path,
                os.path.dirname(os.path.normpath(model_binary)),
            )

    def __copy_additional_files_from_tempdir(self, additional_files, output_path):
        Path(output_path).mkdir(parents=True)
        for file_path in additional_files:
            copyfile(file_path, os.path.join(output_path, os.path.basename(file_path)))

    def __copy_additional_files_from_local(
        self, additional_files, output_path, model_parent_path
    ):
        for file_path in additional_files:
            output_file_path = os.path.join(
                output_path, os.path.relpath(file_path, model_parent_path)
            )
            os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

            copyfile(
                file_path,
                output_file_path,
            )

    def zip_files(self, file_path: str, zip_path: str):
        """Create zip file at the specified zip path from a file or folder path

        Args:
            file_path (str): The file or folder to zip
            zip_path (str): Path to create the new zip at
        """
        if os.path.isdir(file_path):
            self.__zip_directory(file_path, zip_path)

        else:
            self.__zip_file(file_path, zip_path)

    def __zip_file(self, file_path: str, zip_path: str):
        """Zip a single file into new zip created at zip_path

        Args:
            file_path (str): Path to file to zip
            zip_path (str): Output path for zip
        """
        file_name = os.path.split(file_path)[1]

        with ZipFile(zip_path, "w") as zf:
            zf.write(file_path, arcname=file_name)

    def __zip_directory(self, file_path: str, zip_path: str):
        """Zip a directory of files into new zip created at the zip_path

        Args:
            file_path (str): Path to code or binary folder
            zip_path (str): Output path for zip
        """
        with ZipFile(zip_path, "w") as zf:
            for dir_path, _, files in os.walk(file_path):
                output_dir = self.__get_output_dir(dir_path, file_path)

                for file in files:
                    zf.write(
                        filename=f"{dir_path}/{file}", arcname=f"{output_dir}{file}"
                    )

    def __get_output_dir(self, file_path: str, dir_path: str):
        """Remove top level folder to get the output dir required for the zip files

        Args:
            file_path (str): Path to code or binary folder
            dir_path (str): Directory path within code or binary folder

        Returns:
            str: Output directory with top level folder removed
        """
        if dir_path == file_path:
            return ""

        return os.path.join(Path(file_path).relative_to(dir_path)) + os.path.sep

    def generate_requirements_file(self, module_path: str, output_path: str):
        """Generate requirements.txt file based on imports within a Notebook,
            Python file, or Python project

        Args:
            module_path (str): Path to the Python file used to generate requirements.txt
            output_path (str): Output path in format output/path/requirements.txt

        Raises:
            Exception: Unable to create requirements.txt from specified file at specified location
        """
        try:
            subprocess.run(
                ["pipreqsnb", module_path, "--savepath", output_path],
                stderr=subprocess.STDOUT,
            )

        except subprocess.CalledProcessError:
            raise subprocess.CalledProcessError(
                "Unable to create requirements file at the specified location"
            ) from None
