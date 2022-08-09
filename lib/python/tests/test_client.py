import os
import re
from unittest.mock import patch

import pytest
import requests
import responses
from bailoclient.client import Client
from bailoclient.config import APIConfig, BailoConfig
from bailoclient.models import Model, User
from bailoclient.models.model import ValidationError, ValidationResult
from bailoclient.utils.exceptions import DataInvalid, InvalidMetadata

from tests.mocks.mock_api import MockAPI
from tests.mocks.mock_auth import MockAuthentication

BAILO_URL = os.getenv("BAILO_URL")


@pytest.fixture()
def mock_client():
    config = BailoConfig(
        api=APIConfig(url=BAILO_URL, ca_verify=True),
    )
    auth = MockAuthentication()
    api = MockAPI(config, auth, "tests/resources/responses/responses.json")
    return Client(config, authenticator=auth, api=api)


@patch("bailoclient.client.Client.get_model_schema")
def test_get_model_schema(mock_get_model_schema, mock_client):

    mock_get_model_schema.return_value = {"response": "this is a thing"}

    model_uuid = "xyz"

    resp = mock_client.get_model_schema(model_uuid)

    assert resp == {"response": "this is a thing"}


@patch("bailoclient.client.Client.get_users")
def test_get_user_by_name_returns_user_object_with_matching_name(
    mock_get_users, mock_client
):

    mock_get_users.return_value = [User({"id": "user"})]

    user = mock_client.get_user_by_name("user")

    assert user.id == "user"


@patch("bailoclient.client.Client.get_users")
def test_get_user_by_name_returns_None_if_no_matching_users(
    mock_get_users, mock_client
):

    mock_get_users.return_value = [User({"id": "user"})]

    user = mock_client.get_user_by_name("test")

    assert user is None


def test_get_model_card_errors_if_no_model_id_or_uuid_provided(mock_client):

    with pytest.raises(
        ValueError,
        match="You must provide either a model_uuid or model_id to retrieve a model card",
    ):
        mock_client.get_model_card()


def test_validate_uploads_raises_error_if_filepath_does_not_exist(mock_client):
    model_card = Model(_schema={"key": "value"})

    with pytest.raises(
        DataInvalid, match=re.escape("this/path/does/not/exist does not exist")
    ):
        mock_client._validate_uploads(
            card=model_card,
            binary_file="this/path/does/not/exist",
            code_file="tests/resources/model_files/code.zip",
        )


@patch("bailoclient.client.Model.validate")
def test_validate_uploads_raises_error_if_model_card_is_invalid(
    mock_validate, mock_client
):

    validation_errors = [ValidationError("field", "message")]
    mock_validate.return_value = ValidationResult(validation_errors)

    model_card = Model(_schema={"key": "value"})

    with pytest.raises(
        DataInvalid,
        match=re.escape(f"Model invalid: {validation_errors}"),
    ):
        mock_client._validate_uploads(
            card=model_card,
            binary_file="../../../__tests__/example_models/minimal_model/minimal_binary.zip",
            code_file="../../../__tests__/example_models/minimal_model/minimal_code.zip",
        )


@patch("bailoclient.client.minimal_keys_in_dictionary")
def test_validate_uploads_raises_error_if_metadata_is_invalid(
    mock_validate_metadata, mock_client
):

    mock_validate_metadata.return_value = {"valid": False, "error_message": "error"}

    metadata = {"schema": "value"}

    with pytest.raises(
        InvalidMetadata,
        match=re.escape("Metadata error - refer to minimal_metadata"),
    ):
        mock_client._validate_uploads(
            metadata=metadata,
            binary_file="../../../__tests__/example_models/minimal_model/minimal_binary.zip",
            code_file="../../../__tests__/example_models/minimal_model/minimal_code.zip",
        )
