import os
import re
import tempfile
from unittest.mock import patch

import pytest

from bailoclient.client.validation import (
    minimal_keys_in_dictionary,
    validate_model_card,
    validate_metadata,
    validate_file_paths,
    deployment_matches,
    too_large_for_gateway,
)
from bailoclient.exceptions import DataInvalid, InvalidMetadata, InvalidFilePath
from bailoclient.models import Model
from bailoclient.models.model import ValidationError, ValidationResult


MINIMAL_MODEL_PATH = os.getenv("MINIMAL_MODEL_PATH")


def test_minimal_keys_in_dict_returns_valid_result_if_both_dictionaries_are_empty():
    result = minimal_keys_in_dictionary({}, {})

    assert result == {"valid": True}


def test_minimal_keys_in_dict_returns_error_if_dict2_does_not_include_key_from_minimal_dict():
    result = minimal_keys_in_dictionary({"key1": "value1"}, {})

    assert not result["valid"]
    assert result["error_message"] == "must contain 'key1'"


def test_minimal_keys_in_dict_returns_error_if_dict2_has_empty_value_for_key_from_minimal_dict():
    result = minimal_keys_in_dictionary({"key1": "value1"}, {"key1": None})

    assert not result["valid"]
    assert result["error_message"] == "'key1' cannot be empty"


def test_minimal_keys_in_dict_returns_error_if_dict2_is_missing_subkeys_from_minimal_dict():
    result = minimal_keys_in_dictionary(
        {"key1": {"key2": "value1"}}, {"key1": "value1"}
    )

    assert not result["valid"]
    assert result["error_message"] == "missing data under 'key1'"


def test_minimal_keys_in_dict_validates_if_minimal_dict_is_empty():
    result = minimal_keys_in_dictionary({}, {"key1": "value1"})

    assert result["valid"]


def test_minimal_keys_in_dict_ignores_extra_keys_in_dict2():
    result = minimal_keys_in_dictionary(
        {"key1": "value"}, {"key1": "value1", "key2": "value2"}
    )

    assert result["valid"]


def test_minimal_keys_in_dict_validates_multilevel_dictionaries():
    result = minimal_keys_in_dictionary(
        {"key1": {"key2": {"key3": "value"}}}, {"key1": {"key2": {"key3": "value"}}}
    )

    assert result["valid"]


def test_minimal_keys_in_dict_allows_false_as_valid_value():
    result = minimal_keys_in_dictionary(
        {"key1": {"key2": {"key3": "value"}}}, {"key1": {"key2": {"key3": False}}}
    )

    assert result["valid"]


def test_minimal_keys_in_dict_does_not_allow_empty_string_as_valid_value():
    result = minimal_keys_in_dictionary(
        {"key1": {"key2": {"key3": "value"}}}, {"key1": {"key2": {"key3": ""}}}
    )

    assert not result["valid"]


@patch("bailoclient.client.client.Model.validate")
def test_validate_model_card_raises_error_if_model_card_is_invalid(
    patch_validate, bailo_url
):
    validation_errors = [ValidationError("field", "message")]
    patch_validate.return_value = ValidationResult(validation_errors)

    model_card = Model(_schema={"key": "value"})

    with pytest.raises(
        DataInvalid,
        match=re.escape(f"Model invalid: {validation_errors}"),
    ):
        validate_model_card(model_card=model_card)


@patch(
    "bailoclient.client.validation.minimal_keys_in_dictionary",
    return_value={"valid": False, "error_message": "error"},
)
def test_validate_metadata_raises_error_if_metadata_is_invalid(patch_validate_metadata):
    metadata = {"schema": "value"}

    with pytest.raises(
        InvalidMetadata,
        match=re.escape("Metadata error - refer to minimal_metadata"),
    ):
        validate_metadata(
            metadata=metadata,
            minimal_metadata_path="../../frontend/cypress/fixtures/minimal_metadata.json",
        )


def test_validate_filepaths_raises_error_if_filepath_does_not_exist():
    with pytest.raises(
        InvalidFilePath, match=re.escape("this/path/does/not/exist does not exist")
    ):
        validate_file_paths(
            "this/path/does/not/exist",
        )


def test_validate_filepaths_raises_error_if_a_directory_is_uploaded():
    with pytest.raises(
        InvalidFilePath,
        match=re.escape("../../frontend/cypress/fixtures is a directory"),
    ):
        validate_file_paths(
            "../../frontend/cypress/fixtures",
        )


def test_validate_file_paths(temp_dir):
    with tempfile.TemporaryFile() as file:
        validate_file_paths(*[file.name, file.name])


def test_too_large_for_gateway_fail():
    class Data:
        @property
        def len(self):
            return 100_000_000

    assert too_large_for_gateway(Data(), True) is True


def test_deployment_matches_returns_false_if_deployment_does_not_match_criteria(
    deployment_1,
):
    assert not deployment_matches(
        deployment_1,
        deployment_name="incorrect_name",
        model_uuid="id",
        model_version="1",
    )


def test_deployment_matches_ignores_version_if_not_provided(deployment_1, deployment_2):
    assert deployment_matches(
        deployment_1,
        deployment_name="deployment_name",
        model_uuid="id",
        model_version=None,
    )
    assert deployment_matches(
        deployment_1,
        deployment_name="deployment_name",
        model_uuid="id",
        model_version=None,
    )
