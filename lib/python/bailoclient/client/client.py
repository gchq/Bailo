"""Client class for connecting and interacting with a Bailo instance"""

import getpass
import json
import os
from datetime import datetime
from glob import glob
from typing import Union, Dict, List

from pkg_resources import resource_filename
from requests_toolbelt.multipart.encoder import MultipartEncoder

from bailoclient.client.http import RequestsAdapter
from bailoclient.models import Model, User
from bailoclient.exceptions import (
    CannotIncrementVersion,
    DeploymentNotFound,
    InvalidFileRequested,
    UserNotFound,
)
from bailoclient.client.utils import generate_payload
from bailoclient.client.validation import (
    too_large_for_gateway,
    deployment_matches,
    validate_uploads,
)
from bailoclient.config import CognitoConfig, Pkcs12Config, BailoConfig


class Client:
    """Client interface for interacting with API"""

    def __init__(self, config: BailoConfig):
        self.api = RequestsAdapter(config)
        self.connection_params = None
        self.config = config

    def get_model_schema(self, model_uuid: str) -> Dict:
        """Get schema for a model by its UUID

        Args:
            model_uuid (str): the external UUID of a model.

        Returns:
            dict: The schema associated with a given model
        """
        return self.api.get(f"/model/{model_uuid}/schema")

    def get_upload_schemas(self) -> List:
        """Get list of available model schemas

        Returns:
            list: List of model schemas
        """
        return self.api.get("/schemas?use=UPLOAD")

    def get_deployment_schemas(self) -> List:
        """Get list of deployment schemas

        Returns:
            List: List of deployment schemas
        """
        return self.api.get("/schemas?use=DEPLOYMENT")

    def get_users(self) -> List[User]:
        """Get list of users

        Returns:
            List: List of User objects
        """
        return [User(user_data) for user_data in self.api.get("/users")["users"]]

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

        Raises:
            UserNotFound: The user could not be found

        Returns:
            User: User with given name
        """
        users = self.get_users()
        for user in users:
            if user.id == name:
                return user
        raise UserNotFound(f"{name}")

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

    def get_deployment_by_uuid(self, deployment_uuid: str) -> Dict:
        """Get deployment by deployment UUID

        Args:
            deployment_uuid (str): Deployment UUID

        Returns:
            dict: Deployment
        """
        return self.api.get(f"/deployment/{deployment_uuid}")

    def get_user_deployments(self, user_id: str) -> List[Dict]:
        """Get deployments for a given user

        Args:
            user_id (str): ID of the user

        Returns:
            list[dict]: Deployments for user
        """
        return self.api.get(f"/deployment/user/{user_id}")

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
            if deployment_matches(
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

    def __model(self, model: dict) -> Model:
        """Create Model with schema

        Args:
            model (dict): Model data returned from API

        Returns:
            Model: Model class object
        """
        return Model(model, _schema=self.get_model_schema(model["uuid"]))

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

    def _get_model_card_by_id(self, model_id: str) -> Dict:
        """Internal method to retrieve model card by its internal ID (e.g. 62d9abb7e5eb14ee63823618)

        Args:
            model_id (str): Internal model ID

        Returns:
            dict: Requested model
        """
        return self.__model(self.api.get(f"model/id/{model_id}"))

    def get_model_versions(self, model_uuid: str) -> List[Dict]:
        """Get all versions of a model

        Args:
            model_uuid (str): Model UUID

        Returns:
            List[dict]: List of versions
        """
        return self.api.get(f"model/{model_uuid}/versions")

    def get_model_deployments(self, model_uuid: str) -> List[Dict]:
        """Get all deployments of a model

        Args:
            model_uuid (str): Model UUID

        Returns:
            List[dict]: List of deployments of the model
        """
        return self.api.get(f"model/{model_uuid}/deployments")

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

        validate_uploads(
            binary_file=binary_file,
            code_file=code_file,
            metadata=metadata,
            minimal_metadata_path=resource_filename(
                "bailoclient", "resources/minimal_metadata.json"
            ),
        )

        payload = generate_payload(metadata_json, binary_file, code_file)

        if too_large_for_gateway(payload, aws_gateway):
            raise ValueError(
                "Payload too large; JWT Auth running through AWS Gateway (10M limit)"
            )

        return self._post_model(payload)

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

        validate_uploads(
            binary_file=binary_file,
            code_file=code_file,
            metadata=metadata,
            minimal_metadata_path=resource_filename(
                "bailoclient", "resources/minimal_metadata.json"
            ),
        )

        payload = generate_payload(metadata_json, binary_file, code_file)

        if too_large_for_gateway(payload, aws_gateway):
            raise ValueError(
                "Payload too large; JWT Auth running through AWS Gateway (10M limit)"
            )

        return self._post_model(
            model_data=payload, mode="newVersion", model_uuid=model_uuid
        )

    def request_deployment(self, metadata: dict):
        """Request a new deployment of a model

        Args:
            metadata (dict): Deployment metadata. See deployment.json for minimal metadata required.
        """
        validate_uploads(
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
        bailo_url: Bailo URL
        username: Cognito username
        password: Cognito password
        user_pool_id: Cognito user pool ID
        client_id: Cognito client ID
        client_secret: Cognito client secret
        region: Cognito region
        ca_verify: Verify SSL certificates. Provide a path to use a custom cert

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
