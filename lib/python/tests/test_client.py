import json
import os
import re
from unittest.mock import Mock, patch

import pytest
from bailoclient.client import Client
from bailoclient.config import APIConfig, BailoConfig
from bailoclient.models import Model, User
from bailoclient.models.model import ValidationError, ValidationResult
from bailoclient.utils.exceptions import (
    CannotIncrementVersion,
    DataInvalid,
    DeploymentNotFound,
    InvalidFilePath,
    InvalidFileRequested,
    InvalidMetadata,
    ModelFileExportNotAllowed,
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


@patch("bailoclient.client.Client._Client__model")
def test_get_model_card_gets_version_if_version_provided(mock_model, mock_client):
    model_uuid = "id"
    model_version = "version"

    mock_client.api.get = Mock()
    mock_client.get_model_card(model_uuid=model_uuid, model_version=model_version)

    mock_client.api.get.assert_called_once_with(
        f"model/{model_uuid}/version/{model_version}"
    )


@patch("bailoclient.client.Client._Client__model")
def test_get_model_card_gets_model_if_no_version_provided(mock_model, mock_client):
    model_uuid = "id"

    mock_client.api.get = Mock()
    mock_client.get_model_card(model_uuid=model_uuid)

    mock_client.api.get.assert_called_once_with(f"model/uuid/{model_uuid}")


@patch("bailoclient.client.Model.validate")
def test_validate_model_card_raises_error_if_model_card_is_invalid(
    mock_validate, mock_client
):

    validation_errors = [ValidationError("field", "message")]
    mock_validate.return_value = ValidationResult(validation_errors)

    model_card = Model(_schema={"key": "value"})

    with pytest.raises(
        DataInvalid,
        match=re.escape(f"Model invalid: {validation_errors}"),
    ):
        mock_client._Client__validate_model_card(
            model_card=model_card,
        )


@patch(
    "bailoclient.client.minimal_keys_in_dictionary",
    return_value={"valid": False, "error_message": "error"},
)
def test_validate_metadata_raises_error_if_metadata_is_invalid(
    mock_validate_metadata, mock_client
):
    metadata = {"schema": "value"}

    with pytest.raises(
        InvalidMetadata,
        match=re.escape("Metadata error - refer to minimal_metadata"),
    ):
        mock_client._Client__validate_metadata(
            metadata=metadata,
            minimal_metadata_path="./examples/resources/example_metadata.json",
        )


def test_validate_filepaths_raises_error_if_filepath_does_not_exist(mock_client):
    model_card = Model(_schema={"key": "value"})

    with pytest.raises(
        InvalidFilePath, match=re.escape("this/path/does/not/exist does not exist")
    ):
        mock_client._Client__validate_file_paths(
            "this/path/does/not/exist",
        )


def test_validate_filepaths_raises_error_if_a_directory_is_uploaded(mock_client):
    model_card = Model(_schema={"key": "value"})

    with pytest.raises(
        InvalidFilePath,
        match=re.escape("../../__tests__/example_models/minimal_model is a directory"),
    ):

        mock_client._Client__validate_file_paths(
            "../../__tests__/example_models/minimal_model",
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


def test_add_files_to_payload_adds_code_and_binary_files(mock_client):
    payloads = []
    mock_client._Client__add_files_to_payload(
        payloads=payloads,
        binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
        code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
    )

    assert len(payloads) == 2
    assert "code" in payloads[0]
    assert "binary" in payloads[1]
    assert "minimal_code.zip" in payloads[0][1]
    assert "minimal_binary.zip" in payloads[1][1]


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
    mock_client.api.get = Mock(return_value=[{"version": "1"}, {"version": "2"}])

    version = mock_client._increment_model_version("model_uuid")

    assert version == "3"


def test_increment_model_version_raises_error_if_unable_to_increase_version_by_one(
    mock_client,
):
    mock_client.api.get = Mock(return_value=[{"version": "a"}, {"version": "b"}])

    with pytest.raises(
        CannotIncrementVersion,
        match="Please manually provide an updated version number",
    ):
        mock_client._increment_model_version("model_uuid")


@patch("bailoclient.client.Client._generate_payload")
@patch("bailoclient.client.Client._increment_model_version")
def test_update_model_is_called_with_expected_params(
    mock_increment_version, mock_generate_payload, mock_client
):

    payload = Mock({"payload": "data"}, content_type="content")
    mode = "newVersion"
    model_uuid = "model"

    mock_generate_payload.return_value = payload
    mock_increment_version.return_value = "3"
    mock_client.api.post = Mock(return_value={"uuid": model_uuid})

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
    mock_client.api.post = Mock(return_value={"uuid": model_uuid})

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


@patch("bailoclient.client.Client._Client__allow_exports", return_value=False)
def test_download_model_files_raises_error_if_model_files_are_not_exportable(
    mock_allow_exports, mock_client
):
    with pytest.raises(ModelFileExportNotAllowed):
        mock_client.download_model_files(
            deployment_uuid="test", model_version="1", file_type="invalid"
        )


@patch("bailoclient.client.Client._Client__allow_exports", return_value=True)
def test_download_model_files_raises_error_if_file_type_is_not_code_or_binary(
    mock_allow_exports,
    mock_client,
):
    with pytest.raises(InvalidFileRequested):
        mock_client.download_model_files(
            deployment_uuid="test", model_version="1", file_type="invalid"
        )


@patch("bailoclient.client.Client._Client__allow_exports", return_value=True)
def test_download_model_files_raises_error_if_output_dir_already_exists_and_user_has_not_specified_overwrite(
    mock_allow_exports, mock_client, tmpdir
):
    with pytest.raises(FileExistsError):
        mock_client.download_model_files(
            deployment_uuid="test", model_version="1", output_dir=str(tmpdir)
        )


@patch("bailoclient.client.Client._Client__allow_exports", return_value=True)
def test_download_model_files_overwrites_existing_output_dir_if_user_has_specified_overwrite(
    mock_allow_exports, mock_client, tmpdir
):
    deployment_uuid = "test"
    model_version = "1"
    file_type = "binary"

    mock_client.api.get = Mock(return_value=200)

    mock_client.download_model_files(
        deployment_uuid=deployment_uuid,
        model_version=model_version,
        file_type=file_type,
        output_dir=str(tmpdir),
        overwrite=True,
    )

    mock_client.api.get.assert_called_once_with(
        f"/deployment/{deployment_uuid}/version/{model_version}/raw/{file_type}",
        output_dir=str(tmpdir),
    )


@patch("bailoclient.client.Client.get_deployment_by_uuid")
@patch("bailoclient.client.Client.get_model_card")
def test_allow_exports_returns_false_if_model_does_not_allow_exports(
    mock_get_model_card, mock_get_deployment, mock_client
):
    mock_get_deployment.return_value = {"model": {"uuid": "123"}}
    mock_get_model_card.return_value = {
        "currentMetadata": {"buildOptions": {"exportRawModel": False}}
    }

    allow_exports = mock_client._Client__allow_exports("dep")

    mock_get_deployment.mock_called_once_with("dep")
    mock_get_model_card.assert_called_once_with(model_uuid="123")
    assert not allow_exports


@patch("bailoclient.client.Client.get_me", return_value=User(_id="user"))
@patch(
    "bailoclient.client.Client.get_user_deployments",
    return_value={"deployment_id": "deployment"},
)
def test_get_my_deployments_gets_deployments_for_current_user(
    mock_get_user_deployments, mock_get_me, mock_client
):
    mock_client.get_my_deployments()

    mock_get_user_deployments.assert_called_once()
    mock_get_me.assert_called_once()


@patch("bailoclient.client.Client.get_my_deployments", return_value=[])
def test_find_my_deployment_raises_error_if_no_user_deployments_found(
    mock_get_my_deployments, mock_client
):
    with pytest.raises(DeploymentNotFound):
        mock_client.find_my_deployment(deployment_name="deployment", model_uuid="model")


def deployment():
    return {
        "metadata": {
            "highLevelDetails": {
                "name": "deployment_name",
                "modelID": "id",
                "initialVersionRequested": "1",
            },
            "timeStamp": "2022-09-29T14:08:37.528Z",
        }
    }


def deployment_two():
    return {
        "metadata": {
            "highLevelDetails": {
                "name": "deployment_name",
                "modelID": "id",
                "initialVersionRequested": "2",
            },
            "timeStamp": "2022-09-30T14:08:37.528Z",
        }
    }


@patch("bailoclient.client.Client.get_my_deployments")
def test_find_my_deployment_raises_error_if_no_deployments_match(
    mock_get_my_deployments, mock_client
):
    mock_get_my_deployments.return_value = [deployment()]

    with pytest.raises(DeploymentNotFound):
        mock_client.find_my_deployment(
            deployment_name="deployment_name", model_uuid="incorrect_id"
        )


@patch("bailoclient.client.Client.get_my_deployments")
def test_find_my_deployment_finds_latest_version_if_multiple_matching_deployments_found(
    mock_get_my_deployments, mock_client
):
    older_deployment = deployment()
    newer_deployment = deployment_two()

    mock_get_my_deployments.return_value = [older_deployment, newer_deployment]

    my_deployment = mock_client.find_my_deployment(
        deployment_name="deployment_name", model_uuid="id"
    )

    assert my_deployment == newer_deployment


def test_deployment_matches_returns_false_if_deployment_does_not_match_criteria(
    mock_client,
):
    dep = deployment()

    match = mock_client._Client__deployment_matches(
        dep, deployment_name="incorrect_name", model_uuid="id", model_version="1"
    )

    assert not match


def test_deployment_matches_ignores_version_if_not_provided(mock_client):
    dep_v1 = deployment()
    dep_v2 = deployment_two()

    match_v1 = mock_client._Client__deployment_matches(
        dep_v1, deployment_name="deployment_name", model_uuid="id", model_version=None
    )
    match_v2 = mock_client._Client__deployment_matches(
        dep_v2, deployment_name="deployment_name", model_uuid="id", model_version=None
    )

    assert match_v1 and match_v2
