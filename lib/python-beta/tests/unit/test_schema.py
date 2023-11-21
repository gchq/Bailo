from __future__ import annotations

from bailo.core import Client, SchemaKind
from bailo.helper import Schema


def test_schema():
    client = Client("https://example.com")
    kind = SchemaKind.Model

    schema = Schema(
        client=client,
        schema_id="test",
        name="test",
        kind=kind,
        json_schema={"test":"test"},
    )

    assert isinstance(schema, Schema)
