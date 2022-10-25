""" Facade for Bailo client """

# pylint: disable="line-too-long"

import os
import logging
import getpass
import tempfile
import subprocess
from typing import Union
from glob import glob
from zipfile import ZipFile

from dotenv import load_dotenv

from bailoclient.utils.exceptions import (
    IncompleteDotEnvFile,
    MissingDotEnvFile,
    UnableToCreateBailoClient,
)

from .auth import CognitoSRPAuthenticator, Pkcs12Authenticator
from .client import Client
from .config import APIConfig, BailoConfig, CognitoConfig, Pkcs12Config
from .utils.enums import ModelFlavours

logger = logging.getLogger(__name__)


class Bailo(Client):
    """Facade for Bailo client"""

    def __init__(
        self,
        bailo_url: str = None,
        pki_p12: str = None,
        pki_ca: str = None,
        cognito_user_pool_id: str = None,
        cognito_client_id: str = None,
        cognito_client_secret: str = None,
        cognito_region: str = None,
        cognito_username: str = None,
        cognito_pwd: str = None,
    ):

        # if no config provided, try and load dotenv file
        if not any(
            [
                bailo_url,
                pki_p12,
                pki_ca,
                cognito_user_pool_id,
                cognito_client_id,
                cognito_client_secret,
                cognito_region,
                cognito_username,
                cognito_pwd,
            ]
        ):
            env_loaded = load_dotenv()

            if not env_loaded:
                raise MissingDotEnvFile(
                    "Unable to find a .env file in the project directory"
                )

            config, auth, *creds = self.__create_client_from_env()

        # create pki client from input
        if pki_p12 and pki_ca and bailo_url:
            config, auth = self.pki_client(pki_p12, pki_ca, bailo_url)

        # create cognito client from input
        if (
            cognito_user_pool_id
            and cognito_client_id
            and cognito_client_secret
            and cognito_region
            and cognito_username
            and cognito_pwd
            and bailo_url
        ):
            config, auth = self.cognito_client(
                cognito_user_pool_id,
                cognito_client_id,
                cognito_client_secret,
                cognito_region,
                bailo_url,
            )
            creds = cognito_username, cognito_pwd

        try:
            super().__init__(config, auth)

        except NameError as err:
            raise UnableToCreateBailoClient(
                """Ensure you have provided all the required Cognito or PKI parameters and a valid BAILO URL"""
            ) from err

        try:
            username, password = creds
            self.connect(username=username, password=password)

        except ValueError:
            self.connect()

    def __create_client_from_env(self):
        """Create a Client from configuration saved in a .env file

        Raises:
            IncompleteDotEnvFile: .env file doesn't contain all the required config

        Returns:
            Client: Authorised client
        """
        cognito_success = True
        pki_success = True

        # attempt to get cognito credentials
        try:
            (
                user_pool_id,
                client_id,
                client_secret,
                region,
                url,
                username,
                password,
            ) = self.__get_cognito_auth_properties()

        except KeyError:
            cognito_success = False

        # attempt to create cognito client
        if cognito_success:
            config, auth = self.cognito_client(
                user_pool_id, client_id, client_secret, region, url
            )
            return config, auth, username, password

        # attempt to get p12 credentials
        try:
            p12_file, ca_file, url = self.__get_pki_auth_properties()

        except KeyError:
            pki_success = False

        # attempt to create pki client
        if pki_success:
            config, auth = self.pki_client(p12_file, ca_file, url)
            return config, auth

        raise IncompleteDotEnvFile(
            "Unable to get all the required Cognito or PKI auth properties from .env file"
        )

    def cognito_client(
        self,
        user_pool_id: str,
        client_id: str,
        client_secret: str,
        region: str,
        bailo_url: str,
        ca_verify: Union[bool, str] = True,
    ):
        """Create an authorised Cognito client

        Args:
            user_pool_id (str): Cognito user pool ID
            client_id (str): Cognito client ID
            client_secret (str): Cognito client secret
            region (str): Cognito region
            bailo_url (str): Bailo URL
            username (str): Cognito username
            password (str): Cognito password

        Returns:
            Client: Authorised Bailo Client
        """

        cognito_config = CognitoConfig(
            user_pool_id=user_pool_id,
            client_id=client_id,
            client_secret=client_secret,
            region=region,
        )
        api_config = APIConfig(url=bailo_url, ca_verify=ca_verify)
        config = BailoConfig(cognito=cognito_config, api=api_config)

        return config, CognitoSRPAuthenticator

    def pki_client(self, p12_file: str, ca_verify: str, url: str):
        """Create an authorised PKI client

        Args:
            p12_file (str): Path to P12 file
            ca_verify (str): Path to CA file
            url (str): Bailo URL

        Returns:
            Client: Authorised Bailo Client
        """
        p12_pwd = getpass.getpass(
            prompt=f"Enter your password for {os.getenv('p12_file')}: "
        )

        pki_config = Pkcs12Config(pkcs12_filename=p12_file, pkcs12_password=p12_pwd)
        api_config = APIConfig(url=url, ca_verify=ca_verify)
        config = BailoConfig(pki=pki_config, api=api_config)

        return config, Pkcs12Authenticator

    def __get_cognito_auth_properties(self):
        """Extract properties required for Cognito auth from environment

        Returns:
            Tuple[str]): Values for Cognito config
        """
        try:
            userpool = os.environ["COGNITO_USERPOOL"]
            client_id = os.environ["COGNITO_CLIENT_ID"]
            client_secret = os.environ["COGNITO_CLIENT_SECRET"]
            region = os.environ["COGNITO_REGION"]
            url = os.environ["BAILO_URL"]
            username = os.environ["COGNITO_USERNAME"]
            password = os.environ["COGNITO_PASSWORD"]

        except KeyError as err:
            logger.info(
                "Unable to find required environment variables for Cognito authentication: %s not found",
                str(err),
            )
            raise KeyError(str(err)) from err

        return userpool, client_id, client_secret, region, url, username, password

    def __get_pki_auth_properties(self):
        """Extract properties required for PKI auth from environment

        Returns:
            Tuple[str]): Values for PKI config
        """
        try:
            p12_file = os.environ["P12_FILE"]
            ca_file = os.environ["CA_FILE"]
            bailo_url = os.environ["BAILO_URL"]

        except KeyError as err:
            logger.info(
                "Unable to find required environment variables for PKI authentication: %s not found",
                str(err),
            )
            raise KeyError(str(err)) from err

        return p12_file, ca_file, bailo_url

    def bundle_model(
        self,
        output_path: str,
        model=None,
        model_binary: str = None,
        model_code: str = None,
        model_requirements: str = None,
        model_flavour: str = None,
        additional_files: list = None,
    ):

        # TODO decide add or remove
        # remove trailing /
        if output_path.endswith("/"):
            output_path = output_path[0:-1]

        # For Mlflow bundling

        if model and not model_flavour:
            raise Exception("Must provide model flavour for Mlflow bundling")

        if model:
            return self.do_mlflow_bundling(
                model,
                output_path,
                model_flavour,
                additional_files,
                model_requirements,
                model_code,
            )

        # For normal bundling

        if not model_binary:
            raise Exception("Must provide model binary or model object and flavour")

        if os.path.isdir(model_binary):
            model_binary = self.extract_model_binary(model_binary)

        if os.path.isdir(model_code):
            model_code, model_requirements, additional_files = self.extract_code_files(
                model_code
            )

        if not model_code and not model_flavour:
            raise Exception(
                "If no model code provided you must provide a model flavour"
            )

        if not model_code:
            model_code = self.identify_model_template(model_flavour)

        if not model_requirements:
            model_requirements = self.generate_requirements_file()

        self.zip_model_files(
            model_code, model_requirements, additional_files, model_binary, output_path
        )

    def do_mlflow_bundling(
        self,
        model,
        output_path: str,
        model_flavour: str,
        additional_files: str = None,
        model_requirements: str = None,
        model_code: str = None,
    ):

        import mlflow

        tmpdir = tempfile.TemporaryDirectory()

        code_path = os.path.join(tmpdir.name, "code")
        binary_path = os.path.join(tmpdir.name, "binary")

        if model_flavour == ModelFlavours.H2O:
            mlflow.h2o.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/h2o.py"

        elif model_flavour == ModelFlavours.KERAS:
            mlflow.keras.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/keras.py"

        elif model_flavour == ModelFlavours.MLEAP:
            if not model_code:
                raise Exception("no template available for MLeap models")

            mlflow.mleap.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

        elif model_flavour == ModelFlavours.PYTORCH:
            mlflow.pytorch.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/pytorch.py"

        elif model_flavour == ModelFlavours.SKLEARN:
            mlflow.sklearn.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/sklearn.py"

        elif model_flavour == ModelFlavours.SPARK:
            mlflow.spark.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/spark.py"

        elif model_flavour == ModelFlavours.TENSORFLOW:
            mlflow.tensorflow.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/tensorflow.py"

        elif model_flavour == ModelFlavours.ONNX:
            mlflow.onnx.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/onnx.py"

        elif model_flavour == ModelFlavours.GLUON:
            mlflow.gluon.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/gluon.py"

        elif model_flavour == ModelFlavours.XGBOOST:
            mlflow.xgboost.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/xgboost.py"

        elif model_flavour == ModelFlavours.LIGHTGBM:
            mlflow.lightgbm.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/lightgbm.py"

        elif model_flavour == ModelFlavours.CATBOOST:
            mlflow.catboost.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/catboost.py"

        elif model_flavour == ModelFlavours.SPACY:
            mlflow.spacy.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/spacy.py"

        elif model_flavour == ModelFlavours.FASTAI:
            mlflow.fastai.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/fastai.py"

        elif model_flavour == ModelFlavours.STATSMODELS:
            mlflow.statsmodels.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/statsmodels.py"

        elif model_flavour == ModelFlavours.PROPHET:
            mlflow.prophet.save_model(
                model,
                path=code_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_code:
                model_code = "./resouces/templates/prophet.py"

        else:
            raise Exception(
                "Model flavour not recognised, must be one of Mlflow supported"
            )

        # copy model.py into tmpdir containing model files
        subprocess.run(["cp", model_code, f"{code_path}/model.py"])

        # move binary file into new folder in tmpdir
        subprocess.run(["mv", glob(f"{code_path}/data/model*")[0], binary_path])

        # create zips
        self.zip_files(binary_path, f"{output_path}/binary.zip")
        self.zip_files(code_path, f"{output_path}/code.zip")

        tmpdir.cleanup()

    def identify_model_template(self, model_flavour: str):
        if model_flavour == ModelFlavours.H2O:
            return "./resouces/templates/h2o.py"

        elif model_flavour == ModelFlavours.KERAS:
            return "./resouces/templates/keras.py"

        elif model_flavour == ModelFlavours.MLEAP:
            raise Exception("no template available for MLeap models")

        elif model_flavour == ModelFlavours.PYTORCH:
            return "./resouces/templates/pytorch.py"

        elif model_flavour == ModelFlavours.SKLEARN:
            return "./resouces/templates/sklearn.py"

        elif model_flavour == ModelFlavours.SPARK:
            return "./resouces/templates/spark.py"

        elif model_flavour == ModelFlavours.TENSORFLOW:
            return "./resouces/templates/tensorflow.py"

        elif model_flavour == ModelFlavours.ONNX:
            return "./resouces/templates/onnx.py"

        elif model_flavour == ModelFlavours.GLUON:
            return "./resouces/templates/gluon.py"

        elif model_flavour == ModelFlavours.XGBOOST:
            return "./resouces/templates/xgboost.py"

        elif model_flavour == ModelFlavours.LIGHTGBM:
            return "./resouces/templates/lightgbm.py"

        elif model_flavour == ModelFlavours.CATBOOST:
            return "./resouces/templates/catboost.py"

        elif model_flavour == ModelFlavours.SPACY:
            return "./resouces/templates/spacy.py"

        elif model_flavour == ModelFlavours.FASTAI:
            return "./resouces/templates/fastai.py"

        elif model_flavour == ModelFlavours.STATSMODELS:
            return "./resouces/templates/statsmodels.py"

        elif model_flavour == ModelFlavours.PROPHET:
            return "./resouces/templates/prophet.py"

        else:
            raise Exception(
                "Model flavour not recognised, must be one of Mlflow supported"
            )

    def extract_code_files(self, model_code: str):
        pass

    def extract_model_binary(self, model_binary: str):
        pass

    def generate_requirements_file(self):
        pass

    def zip_model_files(
        self,
        model_code: str,
        model_requirements: str,
        additional_files: str,
        model_binary: str,
        output_path: str,
    ):
        pass

    def zip_files(self, file_path: str, zip_path: str):
        if os.path.isdir(file_path):
            with ZipFile(zip_path, "w") as zf:
                for dir_path, _, files in os.walk(file_path):
                    if dir_path == file_path:
                        pth = ""

                    else:
                        pth = os.path.join(*os.path.split(dir_path)[1:]) + os.path.sep

                    for file in files:
                        zf.write(filename=f"{dir_path}/{file}", arcname=f"{pth}{file}")

        else:
            with ZipFile(zip_path, "w") as zf:
                zf.write(file_path)
