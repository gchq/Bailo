from __future__ import annotations

import random
import string

import pytest

# isort: split

from bailo import Client, Schema, SchemaKind
from example_schemas import MINIMAL_JSON_SCHEMA


def random_generator(N=10):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=N))


def test_schema():
    client = Client("https://example.com")
    kind = SchemaKind.MODEL

    schema = Schema(
        client=client,
        schema_id="test",
        name="test",
        description="test description",
        kind=kind,
        json_schema={"test": "test"},
    )

    assert isinstance(schema, Schema)


def test_get_all_schema_ids(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/schemas?kind=model",
        json={"success": True, "schemas": [{"id": f"schema{i}"} for i in range(3)]},
    )

    client = Client("https://example.com")
    kind = SchemaKind.MODEL

    all_schemas = Schema.get_all_schema_ids(client, kind)

    assert len(all_schemas) == 3
    assert all_schemas == ["schema0", "schema1", "schema2"]


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "description", "kind", "json_schema"),
    [
        ("Test", "Example Description", SchemaKind.MODEL, MINIMAL_JSON_SCHEMA),
        ("Test", "Example Description", SchemaKind.ACCESS_REQUEST, MINIMAL_JSON_SCHEMA),
    ],
)
def test_create_get_from_version_and_update(name, description, kind, json_schema, integration_client):
    # Create schema
    schema_id = random_generator()
    schema = Schema.create(
        client=integration_client,
        schema_id=schema_id,
        name=name,
        description=description,
        kind=kind,
        json_schema=json_schema,
    )
    assert isinstance(schema, Schema)

    get_schema = Schema.from_id(integration_client, schema_id)

    assert get_schema.schema_id == schema_id
