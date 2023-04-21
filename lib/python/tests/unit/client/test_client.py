import json
import os
import re
from unittest.mock import Mock, patch
from pkg_resources import resource_filename

import pytest
from bailoclient.models import User
from bailoclient.exceptions import (
    CannotIncrementVersion,
    DeploymentNotFound,
    InvalidFileRequested,
    UserNotFound,
)


@patch("bailoclient.client.Client.get_model_schema", autospec=True)
def test_get_model_schema(patch_get_model_schema, null_client):
    patch_get_model_schema.return_value = {"response": "this is a thing"}

    model_uuid = "xyz"

    resp = null_client.get_model_schema(model_uuid)

    assert resp == {"response": "this is a thing"}


@patch("bailoclient.client.Client.get_users")
def test_get_user_by_name_returns_user_object_with_matching_name(
    patch_get_users, null_client
):
    patch_get_users.return_value = [User({"id": "user"})]

    user = null_client.get_user_by_name("user")

    assert user.id == "user"


@patch("bailoclient.client.Client.get_users")
def test_get_user_by_name_raise_exception_if_no_matching_users(
    patch_get_users, null_client
):
    patch_get_users.return_value = [User({"id": "user"})]

    with pytest.raises(UserNotFound):
        null_client.get_user_by_name("test")


@patch("bailoclient.client.Client._Client__model")
def test_get_model_card_gets_version_if_version_provided(patch_model, null_client):
    model_uuid = "id"
    model_version = "version"

    null_client.api.get = Mock()
    null_client.get_model_card(model_uuid=model_uuid, model_version=model_version)

    null_client.api.get.assert_called_once_with(
        f"model/{model_uuid}/version/{model_version}"
    )


@patch("bailoclient.client.Client._Client__model")
def test_get_model_card_gets_model_if_no_version_provided(patch_model, null_client):
    model_uuid = "id"

    null_client.api.get = Mock()
    null_client.get_model_card(model_uuid=model_uuid)

    null_client.api.get.assert_called_once_with(f"model/uuid/{model_uuid}")


def test_post_model_raises_error_if_invalid_mode_given(null_client):
    with pytest.raises(
        ValueError,
        match=re.escape("Invalid mode - must be either newVersion or newModel"),
    ):
        null_client._post_model(
            model_data="",
            mode="invalid",
        )


def test_increment_version_increases_version_by_one(null_client):
    null_client.api.get = Mock(return_value=[{"version": "1"}, {"version": "2"}])

    version = null_client._increment_model_version("model_uuid")

    assert version == "3"


def test_increment_model_version_raises_error_if_unable_to_increase_version_by_one(
    null_client,
):
    null_client.api.get = Mock(return_value=[{"version": "a"}, {"version": "b"}])

    with pytest.raises(
        CannotIncrementVersion,
        match="Please manually provide an updated version number",
    ):
        null_client._increment_model_version("model_uuid")


@patch("bailoclient.client.client.generate_payload")
@patch("bailoclient.client.client.validate_uploads")
@patch("bailoclient.client.client.too_large_for_gateway", return_value=False)
@patch("bailoclient.client.Client._post_model")
def test_update_model_is_called_with_expected_params(
    patch_post_model,
    patch_gateway,
    patch_validate_uploads,
    patch_generate_payload,
    null_client,
):
    mode = "newVersion"
    model_uuid = "model_abc"
    binary_file = "../../frontend/cypress/fixtures/minimal_binary.zip"
    code_file = "../../frontend/cypress/fixtures/minimal_code.zip"
    metadata = {"highLevelDetails": {"modelCardVersion": "2"}}
    metadata_json = json.dumps(metadata)

    payload = Mock(metadata_json, content_type="content")
    patch_generate_payload.return_value = payload

    null_client.update_model(
        metadata=metadata,
        model_uuid=model_uuid,
        binary_file=binary_file,
        code_file=code_file,
    )

    patch_validate_uploads.assert_called_once_with(
        binary_file=binary_file,
        code_file=code_file,
        metadata=metadata,
        minimal_metadata_path=resource_filename(
            "bailoclient", "resources/minimal_metadata.json"
        ),
    )

    patch_generate_payload.assert_called_once_with(
        metadata_json, binary_file, code_file
    )

    patch_post_model.assert_called_once_with(
        model_data=payload, mode=mode, model_uuid=model_uuid
    )


@patch("bailoclient.client.client.generate_payload")
@patch("bailoclient.client.client.validate_uploads")
@patch("bailoclient.client.client.too_large_for_gateway", return_value=True)
def test_update_model_raises_exception_if_model_files_too_large(
    patch_too_large_for_gateway,
    patch_validate_uploads,
    patch_generate_payload,
    null_client,
):
    with pytest.raises(ValueError):
        model_uuid = "model_abc"
        binary_file = "../../frontend/cypress/fixtures/minimal_binary.zip"
        code_file = "../../frontend/cypress/fixtures/minimal_code.zip"
        metadata = {"highLevelDetails": {"modelCardVersion": "2"}}

        null_client.update_model(
            metadata=metadata,
            model_uuid=model_uuid,
            binary_file=binary_file,
            code_file=code_file,
        )


@patch("bailoclient.client.client.generate_payload")
@patch("bailoclient.client.client.validate_uploads")
@patch("bailoclient.client.client.too_large_for_gateway", return_value=False)
@patch("bailoclient.client.Client._post_model")
def test_upload_model_is_called_with_expected_params(
    patch_post_model,
    patch_too_large_for_gateway,
    patch_validate_uploads,
    patch_generate_payload,
    null_client,
):
    binary_file = "../../frontend/cypress/fixtures/minimal_binary.zip"
    code_file = "../../frontend/cypress/fixtures/minimal_code.zip"
    metadata = {"highLevelDetails": {"modelCardVersion": "2"}}
    metadata_json = json.dumps(metadata)

    payload = Mock({"payload": "data"}, content_type="content")

    patch_generate_payload.return_value = payload

    null_client.upload_model(
        metadata=metadata,
        binary_file=binary_file,
        code_file=code_file,
    )

    patch_validate_uploads.assert_called_once_with(
        binary_file=binary_file,
        code_file=code_file,
        metadata=metadata,
        minimal_metadata_path=resource_filename(
            "bailoclient", "resources/minimal_metadata.json"
        ),
    )

    patch_generate_payload.assert_called_once_with(
        metadata_json, binary_file, code_file
    )

    patch_too_large_for_gateway.assert_called_once_with(payload, True)

    patch_post_model.assert_called_once_with(payload)


@patch("bailoclient.client.client.generate_payload")
@patch("bailoclient.client.client.validate_uploads")
@patch("bailoclient.client.client.too_large_for_gateway", return_value=True)
def test_upload_model_raises_exception_if_model_files_too_large(
    patch_too_large_for_gateway,
    patch_validate_uploads,
    patch_generate_payload,
    null_client,
):
    with pytest.raises(ValueError):
        model_uuid = "model_abc"
        binary_file = "../../frontend/cypress/fixtures/minimal_binary.zip"
        code_file = "../../frontend/cypress/fixtures/minimal_code.zip"
        metadata = {"highLevelDetails": {"modelCardVersion": "2"}}

        null_client.upload_model(
            metadata=metadata,
            binary_file=binary_file,
            code_file=code_file,
        )


def test_download_model_files_raises_error_if_file_type_is_not_code_or_binary(
    null_client,
):
    with pytest.raises(InvalidFileRequested):
        null_client.download_model_files(
            deployment_uuid="test", model_version="1", file_type="invalid"
        )


def test_download_model_files_raises_error_if_output_dir_already_exists_and_user_has_not_specified_overwrite(
    null_client, tmpdir
):
    with pytest.raises(FileExistsError):
        null_client.download_model_files(
            deployment_uuid="test", model_version="1", output_dir=str(tmpdir)
        )


def test_download_model_files_overwrites_existing_output_dir_if_user_has_specified_overwrite(
    null_client, tmpdir
):
    deployment_uuid = "test"
    model_version = "1"
    file_type = "binary"

    null_client.api.get = Mock(return_value=200)

    null_client.download_model_files(
        deployment_uuid=deployment_uuid,
        model_version=model_version,
        file_type=file_type,
        output_dir=str(tmpdir),
        overwrite=True,
    )

    null_client.api.get.assert_called_once_with(
        f"/deployment/{deployment_uuid}/version/{model_version}/raw/{file_type}",
        output_dir=str(tmpdir),
    )


@pytest.mark.parametrize(
    "file_type, expected_call_count",
    [("binary", 1), ("code", 1), (None, 2)],
)
def test_download_model_files_does_expected_api_calls(
    file_type, expected_call_count, null_client
):
    null_client.api.get = Mock(return_value=200)

    null_client.download_model_files(
        deployment_uuid="test",
        model_version="1",
        file_type=file_type,
        output_dir="dir",
        overwrite=True,
    )

    assert null_client.api.get.call_count == expected_call_count


@patch("bailoclient.client.Client.get_me", return_value=User(_id="user"))
@patch(
    "bailoclient.client.Client.get_user_deployments",
    return_value={"deployment_id": "deployment"},
)
def test_get_my_deployments_gets_deployments_for_current_user(
    patch_get_user_deployments, patch_get_me, null_client
):
    null_client.get_my_deployments()

    patch_get_user_deployments.assert_called_once()
    patch_get_me.assert_called_once()


@patch("bailoclient.client.Client.get_my_deployments", return_value=[])
def test_find_my_deployment_raises_error_if_no_user_deployments_found(
    patch_get_my_deployments, null_client
):
    with pytest.raises(DeploymentNotFound):
        null_client.find_my_deployment(deployment_name="deployment", model_uuid="model")


@patch("bailoclient.client.Client.get_my_deployments")
def test_find_my_deployment_raises_error_if_no_deployments_match(
    patch_get_my_deployments, null_client, deployment_1
):
    patch_get_my_deployments.return_value = [deployment_1]

    with pytest.raises(DeploymentNotFound):
        null_client.find_my_deployment(
            deployment_name="deployment_name", model_uuid="incorrect_id"
        )


@patch("bailoclient.client.Client.get_my_deployments")
def test_find_my_deployment_finds_latest_version_if_multiple_matching_deployments_found(
    patch_get_my_deployments, null_client, deployment_1, deployment_2
):
    older_deployment = deployment_1
    newer_deployment = deployment_2

    patch_get_my_deployments.return_value = [older_deployment, newer_deployment]

    my_deployment = null_client.find_my_deployment(
        deployment_name="deployment_name", model_uuid="id"
    )

    assert my_deployment == newer_deployment
