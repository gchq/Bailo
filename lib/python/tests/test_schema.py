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
        review_roles=["test"],
    )

    assert isinstance(schema, Schema)


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "description", "kind", "json_schema", "review_roles"),
    [
        ("Test", "Example Description", SchemaKind.MODEL, MINIMAL_JSON_SCHEMA, ["reviewer"]),
        ("Test", "Example Description", SchemaKind.ACCESS_REQUEST, MINIMAL_JSON_SCHEMA, ["reviewer"]),
    ],
)
def test_create_get_from_version_and_update(name, description, kind, json_schema, review_roles, integration_client):
    # Create schema
    schema_id = random_generator()
    schema = Schema.create(
        client=integration_client,
        schema_id=schema_id,
        name=name,
        description=description,
        kind=kind,
        json_schema=json_schema,
        review_roles=review_roles,
    )
    assert isinstance(schema, Schema)

    get_schema = Schema.from_id(integration_client, schema_id)

    assert get_schema.schema_id == schema_id
