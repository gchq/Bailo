from collections import namedtuple
from typing import List

import jsonschema

from ..utils.exceptions import ModelSchemaMissing
from .base import BailoBase


class ValidationError:
    def __init__(self, field, description):
        self.field = field
        self.description = description

    def __repr__(self):
        return f"<ValidationError in {self.field}: {self.description}>"


class ValidationResult:
    def __init__(self, errors: List[ValidationError]):
        self.errors = errors
        self.is_valid = False if self.errors else True

    def __repr__(self):
        return f"<ValidationResult: is_valid: {self.is_valid}, errors: {self.errors}>"


class Model(BailoBase):
    _schema = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # temporary hack because data returned from API doesn't validate
        # against schema
        if hasattr(self, "version"):
            self.version = float(self.version)

    def __dir__(self):
        vals = set(super().__dir__())
        vals.add("validate")
        return list(vals)

    @classmethod
    def get_schema(cls):
        return cls._schema

    @classmethod
    def set_schema(cls, schema: dict):
        cls._schema = schema

    def validate(self) -> ValidationResult:
        if not self._schema:
            raise ModelSchemaMissing("Model schema must be set")
        validator = jsonschema.Draft7Validator(
            self._schema[0], format_checker=jsonschema.FormatChecker()
        )
        errors = validator.iter_errors(self)
        ret_err = []
        for error in errors:
            ret_err.append(
                ValidationError([path for path in error.path], error.message)
            )
        return ValidationResult(ret_err)
