"""Model card"""
from typing import List

import jsonschema
from bailoclient.exceptions import ModelSchemaMissing

from .base import BailoBase


class ValidationError:
    """Validation error"""

    def __init__(self, field, description):
        self.field = field
        self.description = description

    def __repr__(self):
        return f"<ValidationError in {self.field}: {self.description}>"


class ValidationResult:
    """Results of validation (if valid and any errors)"""

    def __init__(self, errors: List[ValidationError]):
        self.errors = errors
        self.is_valid = not self.errors

    def __repr__(self):
        return f"<ValidationResult: is_valid: {self.is_valid}, errors: {self.errors}>"


class Model(BailoBase):
    """Model card class"""

    def __init__(self, *args, **kwargs):
        if "_schema" not in kwargs:
            raise ModelSchemaMissing("Must provide a value for _schema")

        super().__init__(*args, **kwargs)

    def __dir__(self):
        vals = set(super().__dir__())
        vals.add("validate")
        return list(vals)

    @property
    def schema(self):
        """Get model schema

        Returns:
            dict: model schema
        """
        return self._schema

    def validate(self) -> ValidationResult:
        """Validate the model card

        Raises:
            ModelSchemaMissing: Model must have a schema

        Returns:
            ValidationResult: Results of validation process, including
                              whether the schema is valid and any errors
        """

        validator = jsonschema.Draft7Validator(
            self._schema, format_checker=jsonschema.FormatChecker()
        )
        errors = validator.iter_errors(self)
        ret_err = []
        for error in errors:
            ret_err.append(ValidationError(error.path, error.message))
        return ValidationResult(ret_err)
