""" Client provides methods for interacting with the API """

import json
import logging
import os
from functools import wraps
from typing import Union

from requests_toolbelt.multipart import encoder

from .api import AuthorisedAPI
from .auth import AuthenticationInterface, UnauthorizedException
from .config import BailoConfig, load_config
from .models import Model, User
from .utils.exceptions import DataInvalid, UnconnectedClient
from .utils.utils import get_filename_and_mimetype

logger = logging.getLogger(__name__)


def handle_reconnect(fcn):
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


def ensure_model_schema(fcn):
    @wraps(fcn)
    def get_schema(*args, **kwargs):
        fcn_self = args[0]
        if not Model.get_schema():
            logger.debug("Getting model schema")
            schema = fcn_self.get_upload_schemas()
            Model.set_schema(schema)
        return fcn(*args, **kwargs)

    return get_schema


class Client:
    """Client interface for interacting with API"""

    def __init__(
        self,
        config: Union[os.PathLike, BailoConfig],
        authenticator: AuthenticationInterface,
        api: AuthorisedAPI = None,
    ):

        if isinstance(config, os.PathLike):
            self.config = load_config(config)
        elif isinstance(config, BailoConfig):
            self.config = config
        else:
            raise TypeError(
                "Config must be of type BailoConfig or path of a config file"
            )

        if callable(authenticator):
            self.auth = authenticator(self.config)
        else:
            self.auth = authenticator

        if api:
            if callable(api):
                self.api = api(self.config, self.auth)
            else:
                self.api = api

        else:
            self.api = AuthorisedAPI(self.config, self.auth)

        self.connection_params = None

    def connect(self, **kwargs) -> bool:
        """Authenticate with the BailoAPI. Returns True if successful

        Args:
            kwargs: Authentication parameters, varies based on the authentication method used

        Returns:
            bool: authenticated
        """
        self.connection_params = kwargs
        return self.auth.authenticate_user(**kwargs)

    @handle_reconnect
    def get_model_schema(self, model_uuid: str):
        """Get schema for a model by its UUID

        Args:
            model_uuid (str): the external UUID of a model.

        Returns:
            dict: The schema associated with a given model
        """

        return self.api.get(f"/model/{model_uuid}/schema")

    @handle_reconnect
    def get_upload_schemas(self):
        """Get list of available model schemas

        Returns:
            list: List of model schemas
        """
        return self.api.get("/schemas?use=UPLOAD")

    @handle_reconnect
    def get_deployment_schemas(self):
        """Get list of deployment schemas

        Returns:
            List: List of deployment schemas
        """
        return self.api.get("/schemas?use=DEPLOYMENT")

    @handle_reconnect
    def get_users(self):
        """Get list of users

        Returns:
            List: List of User objects
        """
        return [User(_) for _ in self.api.get("/users")["users"]]

    @handle_reconnect
    def get_me(self):
        """Get current user

        Returns:
            User: current user
        """
        return User(self.api.get("/user"))

    def get_user_by_name(self, name: str):
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

    @ensure_model_schema
    @handle_reconnect
    def get_models(
        self,
        filter_str: str = "",
    ):
        """Get list of all models. Optional to filter by filter string

        Args:
            filter_str (str, optional): String to filter models. Defaults to "".

        Returns:
            List: List of Models
        """

        return [
            Model(_)
            for _ in self.api.get(f"/models?type=all&filter={filter_str}")["models"]
        ]

    @ensure_model_schema
    @handle_reconnect
    def get_favourite_models(
        self,
        filter_str: str = "",
    ):
        """Get list of favourite models. Optional to filter by filter string

        Args:
            filter_str (str, optional): String to filter models. Defaults to "".

        Returns:
            List: List of Models
        """

        return [
            Model(_)
            for _ in self.api.get(f"/models?type=favourites&filter={filter_str}")[
                "models"
            ]
        ]

    @ensure_model_schema
    @handle_reconnect
    def get_my_models(
        self,
        filter_str: str = "",
    ):
        """Get list of models for the current user. Optional to filter by filter string

        Args:
            filter_str (str, optional): String to filter models. Defaults to "".

        Returns:
            List: List of Models
        """

        return [
            Model(_)
            for _ in self.api.get(f"/models?type=user&filter={filter_str}")["models"]
        ]

    @ensure_model_schema
    @handle_reconnect
    def get_model_card(self, model_uuid: str = None, model_id: str = None):
        """Retrieve model card by either the external model UUID or the internal model ID

        Args:
            model_uuid (str): external UUID of a model, e.g. fasttext-language-identification-89knco
            model_id (str): internal ID of a model, e.g. 62d9abb7e5eb14ee63823618
        """

        if model_uuid:
            return Model(self.api.get(f"model/uuid/{model_uuid}"))

        if model_id:
            return Model(self.api.get(f"model/id/{model_id}"))

        raise ValueError(
            "You must provide either a model_uuid or model_id to retrieve a model card"
        )

    @ensure_model_schema
    def _validate_uploads(
        self, card: Model = None, binary_file: str = None, code_file: str = None
    ):
        """Validate the model and files provided for upload

        Args:
            card (Model, optional): Model card or minimal schema required for uploading a model.
                                    Defaults to None.
            binary_file (str, optional): File path to model binary. Defaults to None.
            code_file (str, optional): File path to model code. Defaults to None.

        Raises:
            DataInvalid: Invalid model
            DataInvalid: Binary or code file does not exist
        """

        if card:
            validation = card.validate()
            if not validation.is_valid:
                logger.error(
                    """Submitted model card did not validate against model schema provided by %s""",
                    {self.config.api.url},
                )
                for err in validation.errors:
                    logger.error(err)
                raise DataInvalid(f"Model invalid: {validation.errors}")

        for _ in [binary_file, code_file]:
            # TODO check that it's some compressed format supported by Patool
            # (used in workflow-extract-files-from-minio)
            if _ and not os.path.exists(_):
                raise DataInvalid(f"{_} does not exist")

    def _post_model(
        self,
        metadata: dict,
        binary_file: str,
        code_file: str,
        mode: str = "newModel",
        model_uuid: str = None,
    ):
        """Post a new model or an updated model

        Args:
            metadata (dict): Model metadata
            binary_file (str): Path to model binary file
            code_file (str): Path to model code file
            mode (str, optional): newModel or updateModel. Defaults to "newModel".
            model_uuid (str, optional): Model UUID if updating an existing model. Defaults to None.

        Raises:
            ValueError: Invalid mode

        Returns:
            str: Model UUID
        """
        payloads = [("metadata", metadata)]

        for tag, full_filename in zip(["code", "binary"], [code_file, binary_file]):
            fname, mtype = get_filename_and_mimetype(full_filename)
            payloads.append((tag, (fname, open(full_filename, "rb"), mtype)))

        data = encoder.MultipartEncoder(payloads)

        if data.len > 10000000:
            raise ValueError(
                "Payload too large; JWT Auth running through AWS Gateway (10M limit)"
            )

        if mode == "updateModel":
            return self.api.post(
                f"/model?mode={mode}&modelUuid={model_uuid}",
                request_body=data,
                headers={"Content-Type": data.content_type},
            )

        if mode == "newModel":
            return self.api.post(
                f"/model?mode={mode}",
                request_body=data,
                headers={"Content-Type": data.content_type},
            )

        raise ValueError("Invalid mode - must be either updateModel or newModel")

    @handle_reconnect
    def upload_model(self, metadata: dict, binary_file: str, code_file: str):
        """Upload a new model

        Args:
            metadata (dict): Required metadata for upload
            binary_file (str): Path to model binary file
            code_file (str): Path to model code file

        Returns:
            str: UUID of the new model
        """

        metadata_json = json.dumps(metadata)

        self._validate_uploads(binary_file=binary_file, code_file=code_file)

        return self._post_model(metadata_json, binary_file, code_file)

    @handle_reconnect
    def update_model(
        self,
        model_card: Model,
        binary_file: str,
        code_file: str,
    ):
        """Update an existing model based on its UUID.

        Args:
            model_card (Model): The model card of the existing model
            binary_file (str): Path to the model binary file
            code_file (str): Path to the model code file

        Returns:
            str: UUID of the updated model
        """

        self._validate_uploads(model_card, binary_file, code_file)

        new_model_version = str(
            int(model_card["currentMetadata"]["highLevelDetails"]["modelCardVersion"])
            + 1
        )

        metadata = model_card["currentMetadata"]
        metadata.highLevelDetails.modelCardVersion = new_model_version
        metadata = metadata.toJSON()

        return self._post_model(metadata, binary_file, code_file)
