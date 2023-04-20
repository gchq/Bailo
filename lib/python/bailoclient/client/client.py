""" Client provides methods for interacting with the API """

# pylint: disable=too-many-arguments

import getpass
import json
import logging
import os
from datetime import datetime
from functools import wraps
from glob import glob
from typing import Callable, Union, Dict, List

from pkg_resources import resource_filename
from requests_toolbelt.multipart.encoder import MultipartEncoder

from bailoclient.client.http import RequestsAdapter
from bailoclient.client.auth import UnauthorizedException
from bailoclient.models import Model, User
from bailoclient.utils.exceptions import (
    CannotIncrementVersion,
    DataInvalid,
    DeploymentNotFound,
    InvalidFilePath,
    InvalidFileRequested,
    InvalidMetadata,
    UnconnectedClient,
)
from bailoclient.utils.utils import (
    get_filename_and_mimetype,
    minimal_keys_in_dictionary,
)
from bailoclient.config import CognitoConfig, Pkcs12Config, BailoConfig

logger = logging.getLogger(__name__)


def handle_reconnect(fcn: Callable):
    """Reconnect the Client

    Args:
        fcn (Callable): Client function

    Raises:
        UnconnectedClient: Client has not previously been connected

    Returns:
        Callable: Function to handle reconnecting
    """

    @wraps(fcn)
    def reconnect(*args, **kwargs):
        fcn_self = args[0]
        try:
            return fcn(*args, **kwargs)

        except UnauthorizedException as exc:
            logger.debug("Not currently connected to Bailo")

            if fcn_self.connection_params:
                logger.debug("Reconnecting")
                fcn_self.auth.authenticate_user(**fcn_self.connection_params)
                return fcn(*args, **kwargs)

            logger.error("Client has not previously connected")
            raise UnconnectedClient("Client must call connect to authenticate") from exc

    return reconnect


class Client:
    """Client interface for interacting with API"""

    def __init__(self, config: BailoConfig):
        self.api = RequestsAdapter(config)
        self.connect()
        self.connection_params = None
        self.config = config

    # TODO move to api
    def connect(self, **kwargs) -> bool:
        """Authenticate with the BailoAPI. Returns True if successful

        Args:
            kwargs: Authentication parameters, varies based on the authentication method used

        Returns:
            bool: authenticated
        """
        self.connection_params = kwargs
        return self.api._auth.authenticate_user(**kwargs)

    @handle_reconnect
    def get_model_schema(self, model_uuid: str) -> Dict:
        """Get schema for a model by its UUID

        Args:
            model_uuid (str): the external UUID of a model.

        Returns:
            dict: The schema associated with a given model
        """
        return self.api.get(f"/model/{model_uuid}/schema")

    @handle_reconnect
    def get_upload_schemas(self) -> List:
        """Get list of available model schemas

        Returns:
            list: List of model schemas
        """
        return self.api.get("/schemas?use=UPLOAD")

    @handle_reconnect
    def get_deployment_schemas(self) -> List:
        """Get list of deployment schemas

        Returns:
            List: List of deployment schemas
        """
        return self.api.get("/schemas?use=DEPLOYMENT")

    @handle_reconnect
    def get_users(self) -> List[User]:
        """Get list of users

        Returns:
            List: List of User objects
        """
        return [User(user_data) for user_data in self.api.get("/users")["users"]]

    @handle_reconnect
    def get_me(self) -> User:
        """Get current user

        Returns:
            User: current user
        """
        return User(self.api.get("/user"))

    def get_user_by_name(self, name: str) -> User:
        """Get particular user by name

        Args:
            name (str): Name of user

        Returns:
            User: User with given name
        """
        users = self.get_users()
        for user in users:
            if user.id == name:
                return user
        logger.warning("User with display name %s not found", name)
        return None

    @handle_reconnect
    def download_model_files(
        self,
        deployment_uuid: str,
        model_version: str,
        file_type: str = None,
        output_dir: str = "./model/",
        overwrite: bool = False,
    ):
        """Download the code or binary for a model. file_type can either be 'binary' or 'code'.

        Args:
            deployment_uuid (str): UUID of the deployment
            model_version (str): Version of the model
            file_type (str, optional): Model files to download. Either 'code' or 'binary'. Defaults to "binary".
            output_dir (str, optional): Output directory for file downloads. Defaults to "./model/".
            overwrite (bool, optional): Whether to overwrite an existing folder with download. Defaults to False.

        Raises:
            InvalidFileRequested: Invalid file type - must be 'code' or 'binary'
            FileExistsError: File already exists at filepath. Overwrite must be specified to overwrite.

        Returns:
            str: Response status code
        """

        if file_type and file_type not in ["code", "binary"]:
            raise InvalidFileRequested(
                "Invalid file_type provided - file_type can either be 'code' or 'binary'"
            )

        if glob(output_dir) and not overwrite:
            raise FileExistsError(
                "A folder already exists at this location. Use overwrite=True if you want to overwrite the existing folder."
            )

        if not file_type:
            code_response = self.api.get(
                f"/deployment/{deployment_uuid}/version/{model_version}/raw/code",
                output_dir=output_dir,
            )

            binary_response = self.api.get(
                f"/deployment/{deployment_uuid}/version/{model_version}/raw/binary",
                output_dir=output_dir,
            )

            return code_response, binary_response

        return self.api.get(
            f"/deployment/{deployment_uuid}/version/{model_version}/raw/{file_type}",
            output_dir=output_dir,
        )

    @handle_reconnect
    def get_deployment_by_uuid(self, deployment_uuid: str) -> Dict:
        """Get deployment by deployment UUID

        Args:
            deployment_uuid (str): Deployment UUID

        Returns:
            dict: Deployment
        """
        return self.api.get(f"/deployment/{deployment_uuid}")

    @handle_reconnect
    def get_user_deployments(self, user_id: str) -> List[Dict]:
        """Get deployments for a given user

        Args:
            user_id (str): ID of the user

        Returns:
            list[dict]: Deployments for user
        """
        return self.api.get(f"/deployment/user/{user_id}")

    @handle_reconnect
    def get_my_deployments(self) -> List[Dict]:
        """Get deployments for the current user

        Returns:
            list[dict]: Deployments for the current user
        """
        return self.get_user_deployments(self.get_me()._id)

    def find_my_deployment(
        self,
        deployment_name: str,
        model_uuid: str,
        model_version: str = None,
    ) -> Dict:
        """Find a particular deployment belonging to the current user. If multiple matching deployments are found, return the most recent deployment.

        Args:
            deployment_name (str): Name of the deployment
            model_uuid (str): UUID of the model associated with the deployment
            model_version (str, optional): Version of the model that the deployment was created for. Defaults to None.

        Returns:
            dict: Matching deployment
        """

        user_deployments = self.get_my_deployments()

        if not user_deployments:
            raise DeploymentNotFound("You do not currently have any deployments.")

        matching_deployments = [
            deployment
            for deployment in user_deployments
            if self.__deployment_matches(
                deployment, deployment_name, model_uuid, model_version
            )
        ]

        if not matching_deployments:
            raise DeploymentNotFound(
                "Could not find any deployments for the current user matching the provided criteria."
            )

        if len(matching_deployments) == 1:
            return matching_deployments[0]

        timestamps = [
            datetime.strptime(
                deployment["metadata"]["timeStamp"], "%Y-%m-%dT%H:%M:%S.%fZ"
            )
            for deployment in matching_deployments
        ]
        latest = timestamps.index(max(timestamps))

        return matching_deployments[latest]

    def __deployment_matches(
        self,
        deployment: dict,
        deployment_name: str,
        model_uuid: str,
        model_version: str,
    ) -> bool:
        """Check whether a deployment matches the provided filters. Returns True if deployment is a match.

        Args:
            deployment (dict): The model deployment
            deployment_name (str): The name of the requested deployment
            model_uuid (str): The model UUID of the requested deployment
            model_version (str): The model version of the requested deployment

        Returns:
            bool: True if deployment matches provided filters
        """

        deployment_details = deployment["metadata"]["highLevelDetails"]

        return (
            (deployment_details["name"] == deployment_name)
            and (deployment_details["modelID"] == model_uuid)
            and (
                deployment_details["initialVersionRequested"] == model_version
                or not model_version
            )
        )

    def __model(self, model: dict) -> Model:
        """Create Model with schema

        Args:
            model (dict): Model data returned from API

        Returns:
            Model: Model class object
        """
        return Model(model, _schema=self.get_model_schema(model["uuid"]))

    @handle_reconnect
    def get_models(
        self,
        filter_str: str = "",
    ) -> List[Model]:
        """Get list of all models. Optional to filter by filter string

        Args:
            filter_str (str, optional): String to filter models. Defaults to "".

        Returns:
            List: List of Models
        """

        return [
            self.__model(model_metadata)
            for model_metadata in self.api.get(f"/models?type=all&filter={filter_str}")[
                "models"
            ]
        ]

    @handle_reconnect
    def get_favourite_models(
        self,
        filter_str: str = "",
    ) -> List[Model]:
        """Get list of favourite models. Optional to filter by filter string

        Args:
            filter_str (str, optional): String to filter models. Defaults to "".

        Returns:
            List: List of Models
        """

        return [
            self.__model(model_metadata)
            for model_metadata in self.api.get(
                f"/models?type=favourites&filter={filter_str}"
            )["models"]
        ]

    @handle_reconnect
    def get_my_models(
        self,
        filter_str: str = "",
    ) -> List[Model]:
        """Get list of models for the current user. Optional to filter by filter string

        Args:
            filter_str (str, optional): String to filter models. Defaults to "".

        Returns:
            List: List of Models
        """

        return [
            self.__model(model_metadata)
            for model_metadata in self.api.get(
                f"/models?type=user&filter={filter_str}"
            )["models"]
        ]

    @handle_reconnect
    def get_model_card(self, model_uuid: str, model_version: str = None) -> Dict:
        """Get a model by its UUID. Optionally retrieve a specific version of a model.

        Args:
            model_uuid (str): Model UUID
            model_version (str, optional): Model version name/number. Defaults to None.

        Returns:
            dict: Requested model
        """

        if model_version:
            return self.__model(
                self.api.get(f"model/{model_uuid}/version/{model_version}")
            )

        return self.__model(self.api.get(f"model/uuid/{model_uuid}"))

    @handle_reconnect
    def _get_model_card_by_id(self, model_id: str) -> Dict:
        """Internal method to retrieve model card by its internal ID (e.g. 62d9abb7e5eb14ee63823618)

        Args:
            model_id (str): Internal model ID

        Returns:
            dict: Requested model
        """
        return self.__model(self.api.get(f"model/id/{model_id}"))

    @handle_reconnect
    def get_model_versions(self, model_uuid: str) -> List[Dict]:
        """Get all versions of a model

        Args:
            model_uuid (str): Model UUID

        Returns:
            List[dict]: List of versions
        """
        return self.api.get(f"model/{model_uuid}/versions")

    @handle_reconnect
    def get_model_deployments(self, model_uuid: str) -> List[Dict]:
        """Get all deployments of a model

        Args:
            model_uuid (str): Model UUID

        Returns:
            List[dict]: List of deployments of the model
        """
        return self.api.get(f"model/{model_uuid}/deployments")

    @handle_reconnect
    def upload_model(
        self, metadata: dict, binary_file: str, code_file: str, aws_gateway: bool = True
    ) -> str:
        """Upload a new model

        Args:
            metadata (dict): Required metadata for upload
            binary_file (str): Path to model binary file
            code_file (str): Path to model code file
            aws_gateway (bool): Whether or not the data will be uploaded via AWS gateway.
                                Defaults to True.

        Returns:
            str: UUID of the new model

        Raises:
            ValueError: Payload is too large for the AWS gateway (if using)
        """

        metadata_json = json.dumps(metadata)

        self._validate_uploads(
            binary_file=binary_file,
            code_file=code_file,
            metadata=metadata,
            minimal_metadata_path=resource_filename(
                "bailoclient", "resources/minimal_metadata.json"
            ),
        )

        payload = self._generate_payload(metadata_json, binary_file, code_file)

        if self._too_large_for_gateway(payload, aws_gateway):
            raise ValueError(
                "Payload too large; JWT Auth running through AWS Gateway (10M limit)"
            )

        return self._post_model(payload)

    @handle_reconnect
    def update_model(
        self,
        metadata: dict,
        model_uuid: str,
        binary_file: str,
        code_file: str,
        aws_gateway: bool = True,
    ) -> str:
        """Update an existing model based on its UUID.

        Args:
            metadata (dict): Updated model metadata
            model_uuid (str): UUID of model to update
            binary_file (str): Path to the model binary file
            code_file (str): Path to the model code file
            aws_gateway (bool): Whether or not the data will be uploaded via AWS gateway.
                                Defaults to True.

        Returns:
            str: UUID of the updated model

        Raises:
            ValueError: Payload is too large for the AWS gateway (if using)
        """

        metadata_json = json.dumps(metadata)

        self._validate_uploads(
            binary_file=binary_file,
            code_file=code_file,
            metadata=metadata,
            minimal_metadata_path=resource_filename(
                "bailoclient", "resources/minimal_metadata.json"
            ),
        )

        payload = self._generate_payload(metadata_json, binary_file, code_file)

        if self._too_large_for_gateway(payload, aws_gateway):
            raise ValueError(
                "Payload too large; JWT Auth running through AWS Gateway (10M limit)"
            )

        return self._post_model(
            model_data=payload, mode="newVersion", model_uuid=model_uuid
        )

    @handle_reconnect
    def request_deployment(self, metadata: dict):
        """Request a new deployment of a model

        Args:
            metadata (dict): Deployment metadata. See deployment.json for minimal metadata required.
        """
        self._validate_uploads(
            metadata=metadata,
            minimal_metadata_path=resource_filename(
                "bailoclient", "resources/minimal_deployment_metadata.json"
            ),
        )

        metadata_json = json.dumps(metadata)

        return self.api.post(
            "/deployment",
            request_body=metadata_json,
            headers={"Content-Type": "application/json"},
        )

    def _validate_uploads(
        self,
        model_card: Model = None,
        metadata: dict = None,
        minimal_metadata_path: str = None,
        binary_file: str = None,
        code_file: str = None,
    ):
        """Validate the model and files provided for upload

        Args:
            model_card (Model, optional): Model card of the model to update. Defaults to None.
            metadata (dict, optional): Metadata required for uploading a new model. Must
                                       match the minimal metadata. Defaults to None.
            binary_file (str, optional): File path to model binary. Defaults to None.
            code_file (str, optional): File path to model code. Defaults to None.

        Raises:
            DataInvalid: Invalid model
            DataInvalid: Binary or code file does not exist
            InvalidMetadata: Metadata does not meet the minimal metadata
        """

        if model_card:
            self.__validate_model_card(model_card)

        if metadata:
            self.__validate_metadata(metadata, minimal_metadata_path)

        if binary_file and code_file:
            self.__validate_file_paths(binary_file, code_file)

    def __validate_model_card(self, model_card: Model):
        """Validate supplied model card

        Args:
            model_card (Model): Model

        Raises:
            DataInvalid: Model card is not valid
        """
        validation = model_card.validate()
        if not validation.is_valid:
            logger.error(
                """Submitted model card did not validate against model schema provided by %s""",
                {self.config.bailo_url},
            )

            for err in validation.errors:
                logger.error(err)

            raise DataInvalid(f"Model invalid: {validation.errors}")

    def __validate_metadata(self, metadata: dict, minimal_metadata_path: str):
        """Validate supplied metadata against a minimal metadata file

        Args:
            metadata (dict): Supplied metadata for model or deployment
            minimal_metadata_path (str): Path to minimal model/deployment metadata for validation

        Raises:
            InvalidMetadata: Supplied metadata does not contain all the required parameters

        Returns:
            dict: Dictionary of validity and error messages
        """
        with open(minimal_metadata_path, encoding="utf-8") as json_file:
            minimal_metadata = json.load(json_file)

        result = minimal_keys_in_dictionary(minimal_metadata, metadata)

        if not result["valid"]:
            raise InvalidMetadata(
                f"Metadata {result['error_message']} - refer to minimal_metadata"
            )

    def __validate_file_paths(self, *args):
        """Validate any filepaths exist and are not directories. Takes any number of string filepaths

        Raises:
            InvalidFilePath: File path does not exist
            InvalidFilePath: File path is a directory
        """
        for file_path in args:
            # TODO check that it's some compressed format supported by Patool
            # (used in workflow-extract-files-from-minio)
            if file_path and not os.path.exists(file_path):
                raise InvalidFilePath(f"{file_path} does not exist")

            if file_path and os.path.isdir(file_path):
                raise InvalidFilePath(f"{file_path} is a directory")

    def _post_model(
        self,
        model_data,
        mode: str = "newModel",
        model_uuid: str = None,
    ) -> str:
        """Post a new model or an updated model

        Args:
            model_data (MultipartEncoder): encoded payload for uploading
            mode (str, optional): newModel or newVersion. Defaults to "newModel".
            model_uuid (str, optional): Model UUID if updating an existing model. Defaults to None.

        Raises:
            ValueError: Invalid mode

        Returns:
            str: Model UUID
        """

        if mode == "newVersion":
            return self.api.post(
                f"/model?mode={mode}&modelUuid={model_uuid}",
                request_body=model_data,
                headers={"Content-Type": model_data.content_type},
            )

        if mode == "newModel":
            return self.api.post(
                f"/model?mode={mode}",
                request_body=model_data,
                headers={"Content-Type": model_data.content_type},
            )

        raise ValueError("Invalid mode - must be either newVersion or newModel")

    def _generate_payload(
        self,
        metadata: dict,
        binary_file: str,
        code_file: str,
    ) -> MultipartEncoder:
        """Generate payload for posting model or deployment

        Args:
            metadata (dict): Model metadata
            binary_file (str): Path to model binary file
            code_file (str): Path to model code file

        Returns:
            MultipartEncoder: Payload of model data
        """
        payloads = [("metadata", metadata)]
        payloads = self.__add_files_to_payload(payloads, binary_file, code_file)

        return MultipartEncoder(payloads)

    def __add_files_to_payload(self, payloads: list, binary_file: str, code_file: str):
        """Add code and binary files to the payload

        Args:
            payloads (list): List of payloads
            binary_file (str): File path of binary
            code_file (str): File path of code
        """
        for tag, full_filename in zip(["code", "binary"], [code_file, binary_file]):
            fname, mtype = get_filename_and_mimetype(full_filename)
            with open(full_filename, "rb") as file:
                payloads.append((tag, (fname, file.read(), mtype)))

        return payloads

    @staticmethod
    def _too_large_for_gateway(data, aws_gateway: bool) -> bool:
        """If there is an AWS gateway, check that data is not too large

        Args:
            data (MultipartEncoder): the data to be uploaded
            aws_gateway (bool): Whether or not the data will be uploaded via AWS gateway.

        Returns:
            bool: True if data is too large to be uploaded
        """
        return bool(os.getenv("AWS_GATEWAY", aws_gateway)) and data.len > 10000000

    def _increment_model_version(self, model_uuid: str) -> str:
        """Increment the latest version of a model by 1

        Args:
            model_uuid (str): UUID of the model

        Returns:
            str: incremented version number
        """

        model_versions = self.api.get(f"model/{model_uuid}/versions")
        try:
            model_versions = [
                int(model_version["version"]) for model_version in model_versions
            ]
        except ValueError as exc:
            raise (
                CannotIncrementVersion(
                    "Please manually provide an updated version number"
                )
            ) from exc

        latest_version = max(model_versions)

        return str(latest_version + 1)


def create_cognito_client(
    bailo_url: str,
    username: str,
    password: str,
    user_pool_id: str,
    client_id: str,
    client_secret: str,
    region: str,
    ca_verify: Union[bool, str] = True,
) -> Client:
    """Create an authorised Cognito client

    Args:
        username: Cognito username
        password: Cognito password
        user_pool_id: Cognito user pool ID
        client_id: Cognito client ID
        client_secret: Cognito client secret
        region: Cognito region
        bailo_url: Bailo URL

    Returns:
        Client: Authorised Bailo Client
    """

    cognito_config = CognitoConfig(
        username=username,
        password=password,
        user_pool_id=user_pool_id,
        client_id=client_id,
        client_secret=client_secret,
        region=region,
    )

    config = BailoConfig(auth=cognito_config, bailo_url=bailo_url, ca_verify=ca_verify)

    return Client(config)


def create_pki_client(
    p12_file: str, url: str, ca_verify: Union[str, bool] = True
) -> Client:
    """Create an authorised PKI client

    Args:
        p12_file: Path to P12 file
        ca_verify: Path to CA file
        url: Bailo URL

    Returns:
        Client: Authorised Bailo Client
    """
    p12_pwd = getpass.getpass(
        prompt=f"Enter your password for {os.getenv('p12_file')}: "
    )

    pki_config = Pkcs12Config(pkcs12_filename=p12_file, pkcs12_password=p12_pwd)
    config = BailoConfig(auth=pki_config, bailo_url=url, ca_verify=ca_verify)

    return Client(config)


def create_null_client(url: str, ca_verify: Union[str, bool] = True):
    """Create an unauthorised client

    Args:
        url: Bailo URL
        ca_verify: Path to CA file

    Returns:
        Client: Bailo Client
    """
    config = BailoConfig(auth=None, bailo_url=url, ca_verify=ca_verify)
    return Client(config)
