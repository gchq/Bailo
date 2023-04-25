from unittest.mock import patch

import pytest
from bailoclient.models.model import Model, ValidationResult
from bailoclient.exceptions import ModelSchemaMissing


def test_model_cannot_be_created_without_schema():
    with pytest.raises(ModelSchemaMissing):
        Model({"property": "vaue"})


@pytest.fixture
def model():
    return Model(
        {"property": "property_value", "property_2": "property_2_value"},
        _schema={"schema": "schema_value"},
    )


def test_model_args_and_kwargs_are_added_as_properties(model):
    assert model.property == "property_value"
    assert model.property_2 == "property_2_value"
    assert model._schema == {"schema": "schema_value"}


def test_dir_adds_validate_to_list_of_properties(model):
    assert "property" in dir(model)


def test_validate_does_a_thing(model):
    assert isinstance(model.validate(), ValidationResult)


class MockError:
    def __init__(self, path, message):
        self.path = path
        self.message = message


@patch("bailoclient.models.model.jsonschema.Draft7Validator.iter_errors")
def test_validate_adds_errors_if_formatting_errors(patch_iter_errors, model):
    returned_errors = [
        MockError(path="error/path", message="error1"),
        MockError(path="error2/path", message="error2"),
    ]

    patch_iter_errors.return_value = returned_errors

    validation_result = model.validate()

    assert isinstance(validation_result, ValidationResult)
    assert not validation_result.is_valid

    error_messages = [error.description for error in validation_result.errors]
    expected_error_messages = [error.message for error in returned_errors]

    assert error_messages == expected_error_messages
