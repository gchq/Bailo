import json
import os
import re
from unittest.mock import MagicMock, Mock, patch

import pytest
from bailoclient.client import Client
from bailoclient.config import APIConfig, BailoConfig
from bailoclient.models import Model, User
from bailoclient.models.model import ValidationError, ValidationResult
from bailoclient.utils.exceptions import (
    CannotIncrementVersion,
    DataInvalid,
    InvalidFilePath,
    InvalidMetadata,
)

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
        InvalidFilePath, match=re.escape("this/path/does/not/exist does not exist")
    ):
        mock_client._validate_uploads(
            card=model_card,
            binary_file="this/path/does/not/exist",
            code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
        )


def test_validate_uploads_raises_error_if_a_directory_is_uploaded(mock_client):
    model_card = Model(_schema={"key": "value"})

    with pytest.raises(
        InvalidFilePath,
        match=re.escape("../../__tests__/example_models/minimal_model is a directory"),
    ):
        mock_client._validate_uploads(
            card=model_card,
            binary_file="../../__tests__/example_models/minimal_model",
            code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
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
            binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
            code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
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
            binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
            code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
        )


@patch("bailoclient.client.Client._too_large_for_gateway", return_value=True)
def test_generate_payload_raises_error_if_payload_too_large_and_aws_gateway(
    mock_gateway, mock_client
):

    with pytest.raises(
        ValueError,
        match=re.escape(
            "Payload too large; JWT Auth running through AWS Gateway (10M limit)"
        ),
    ):
        mock_client._generate_payload(
            metadata=json.dumps({"schema": "value"}),
            binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
            code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
        )


def test_post_model_raises_error_if_invalid_mode_given(mock_client):

    with pytest.raises(
        ValueError,
        match=re.escape("Invalid mode - must be either newVersion or newModel"),
    ):
        mock_client._post_model(
            model_data="",
            mode="invalid",
        )


def test_increment_version_increases_version_by_one(mock_client):
    mock_client.api.get = MagicMock(return_value=[{"version": "1"}, {"version": "2"}])

    version = mock_client._increment_version("model_uuid")

    assert version == "3"


def test_increment_version_raises_error_if_unable_to_increase_version_by_one(
    mock_client,
):
    mock_client.api.get = MagicMock(return_value=[{"version": "a"}, {"version": "b"}])

    with pytest.raises(
        CannotIncrementVersion,
        match="Please manually provide an updated version number",
    ):
        mock_client._increment_version("model_uuid")


@patch("bailoclient.client.Client._generate_payload")
@patch("bailoclient.client.Client._increment_version")
def test_update_model_is_called_with_expected_params(
    mock_increment_version, mock_generate_payload, mock_client
):

    payload = Mock({"payload": "data"}, content_type="content")
    mode = "newVersion"
    model_uuid = "model"

    mock_generate_payload.return_value = payload
    mock_increment_version.return_value = "3"
    mock_client.api.post = MagicMock(return_value={"uuid": model_uuid})

    mock_client.update_model(
        model_card=Model(
            uuid=model_uuid,
            _schema={"key": "value"},
            currentMetadata={"highLevelDetails": {"modelCardVersion": "2"}},
        ),
        binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
        code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
    )

    mock_client.api.post.assert_called_once_with(
        f"/model?mode={mode}&modelUuid={model_uuid}",
        request_body=payload,
        headers={"Content-Type": payload.content_type},
    )


@patch("bailoclient.client.Client._generate_payload")
@patch("bailoclient.client.Client._validate_uploads")
def test_upload_model_is_called_with_expected_params(
    mock_validate_uploads, mock_generate_payload, mock_client
):

    payload = Mock({"payload": "data"}, content_type="content")
    model_uuid = "model"

    mock_generate_payload.return_value = payload
    mock_client.api.post = MagicMock(return_value={"uuid": model_uuid})

    mock_client.upload_model(
        metadata={"key": "value"},
        binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
        code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
    )

    mock_client.api.post.assert_called_once_with(
        f"/model?mode=newModel",
        request_body=payload,
        headers={"Content-Type": payload.content_type},
    )
