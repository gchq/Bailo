from __future__ import annotations

import random
import string

import pytest
from bailo.core import Client, SchemaKind
from bailo.helper import Schema

MINIMAL_JSON_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "overview": {
            "title": "Overview",
            "description": "Summary of the model functionality.",
            "type": "object",
            "properties": {
                "modelOverview": {
                    "title": "What does the model do?",
                    "description": "A description of what the model does.",
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 5000,
                },
                "tags": {
                    "title": "Descriptive tags for the model.",
                    "description": "These tags will be searchable and will help others find this model.",
                    "type": "array",
                    "widget": "tagSelectorBeta",
                    "items": {"type": "string"},
                    "uniqueItems": True,
                },
            },
            "required": [],
            "additionalProperties": False,
        },
    },
    "required": [],
    "additionalProperties": False,
}


def random_generator(N=10):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=N))


def test_schema():
    client = Client("https://example.com")
    kind = SchemaKind.Model

    schema = Schema(
        client=client,
        schema_id="test",
        name="test",
        kind=kind,
        json_schema={"test": "test"},
    )

    assert isinstance(schema, Schema)


@pytest.mark.integration
@pytest.mark.parametrize(("name", "kind", "json_schema"), [("Test", SchemaKind.Model, MINIMAL_JSON_SCHEMA)])
def test_create_get_from_version_and_update(name, kind, json_schema, integration_client):
    # Create schema
    schema_id = random_generator()
    schema = Schema.create(integration_client, schema_id, name, kind, json_schema)
    assert isinstance(schema, Schema)

    get_schema = Schema.from_id(integration_client, schema_id)

    assert get_schema.schema_id == schema_id
