"""Validation functions for use in the client module"""

import json
import logging
import os
from typing import Optional

from requests_toolbelt import MultipartEncoder

from bailoclient.exceptions import DataInvalid, InvalidMetadata, InvalidFilePath
from bailoclient.models import Model

logger = logging.getLogger(__file__)


def minimal_keys_in_dictionary(minimal_dict: dict, test_dict: dict):
    """Check that a dictionary contains all the keys within a minimal dictionary

    Args:
        minimal_dict: Minimal dictionary for checking against
        test_dict: Dictionary for checking keys

    Returns:
        dict: Result dictionary containing 'valid' and 'error_message' if valid = False
    """
    for key, value in minimal_dict.items():
        try:
            test_dict[key]
        except KeyError:
            return {"valid": False, "error_message": f"must contain '{key}'"}

        model_value = test_dict.get(key)

        if not model_value and model_value is not False:
            return {"valid": False, "error_message": f"'{key}' cannot be empty"}

        if isinstance(value, dict) and not isinstance(model_value, dict):
            return {"valid": False, "error_message": f"missing data under '{key}'"}

        if isinstance(value, dict):
            result = minimal_keys_in_dictionary(value, model_value)

            if not result["valid"]:
                return result

    return {"valid": True}


def validate_model_card(model_card: Model):
    """Validate supplied model card

    Args:
        model_card: Model

    Raises:
        DataInvalid: Model card is not valid
    """
    validation = model_card.validate()
    if not validation.is_valid:
        logger.error("Submitted model card did not validate against model schema")

        for err in validation.errors:
            logger.error(err)
        raise DataInvalid(f"Model invalid: {validation.errors}")


def validate_metadata(metadata: dict, minimal_metadata_path: str):
    """Validate supplied metadata against a minimal metadata file

    Args:
        metadata: Supplied metadata for model or deployment
        minimal_metadata_path: Path to minimal model/deployment metadata for validation

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


def validate_file_paths(*args):
    """Validate any filepaths exist and are not directories. Takes any number of string filepaths

    Raises:
        InvalidFilePath: File path does not exist
        InvalidFilePath: File path is a directory
    """
    for file_path in args:
        if file_path and not os.path.exists(file_path):
            raise InvalidFilePath(f"{file_path} does not exist")

        if file_path and os.path.isdir(file_path):
            raise InvalidFilePath(f"{file_path} is a directory")


def too_large_for_gateway(data: MultipartEncoder, aws_gateway: bool) -> bool:
    """If there is an AWS gateway, check that data is not too large

    Args:
        data: the data to be uploaded
        aws_gateway: Whether or not the data will be uploaded via AWS gateway.

    Returns:
        bool: True if data is too large to be uploaded
    """
    return bool(os.getenv("AWS_GATEWAY", aws_gateway)) and data.len > 10_000_000


def deployment_matches(
    deployment: dict,
    deployment_name: str,
    model_uuid: str,
    model_version: str,
) -> bool:
    """Check whether a deployment matches the provided filters. Returns True if deployment is a match.

    Args:
        deployment: The model deployment
        deployment_name: The name of the requested deployment
        model_uuid: The model UUID of the requested deployment
        model_version: The model version of the requested deployment

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


def validate_uploads(
    model_card: Optional[Model] = None,
    metadata: Optional[dict] = None,
    minimal_metadata_path: Optional[str] = None,
    binary_file: Optional[str] = None,
    code_file: Optional[str] = None,
):
    """Validate the model and files provided for upload

    Args:
        model_card: Model card of the model to update. Defaults to None.
        metadata: Metadata required for uploading a new model. Must
                                   match the minimal metadata. Defaults to None.
        minimal_metadata_path: something
        binary_file: File path to model binary. Defaults to None.
        code_file: File path to model code. Defaults to None.

    Raises:
        DataInvalid: Invalid model
        DataInvalid: Binary or code file does not exist
        InvalidMetadata: Metadata does not meet the minimal metadata
    """

    if model_card:
        validate_model_card(model_card)

    if metadata:
        validate_metadata(metadata, minimal_metadata_path)

    if binary_file and code_file:
        validate_file_paths(binary_file, code_file)
