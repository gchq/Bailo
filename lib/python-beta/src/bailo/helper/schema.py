from __future__ import annotations

from typing import Any

from bailo.core import Client, SchemaKind


class Schema:
    def __init__(
        self,
        client: Client,
        schema_id: str,
        name: str,
        kind: SchemaKind,
        json_schema: dict[str, Any],
    ):
        self.client = client
        self.schema_id = schema_id
        self.name = name
        self.kind = kind
        self.json_schema = json_schema

    @classmethod
    def from_id(cls, client: Client, schema_id: str):
        res = client.get_schema(schema_id=schema_id)
        schema_id, name, kind, json_schema = Schema.__unpack__(res)
        schema = cls(
            client=client,
            schema_id=schema_id,
            name=name,
            kind=kind,
            json_schema=json_schema,
        )

        return schema

    @staticmethod
    def __unpack__(res):
        res = res['schema']
        schema_id = res['id']
        name = res['name']
        kind = res['kind']
        json_schema = res['jsonSchema']

        if kind == 'model':
            kind = SchemaKind.Model
        if kind == 'accessRequest':
            kind = SchemaKind.AccessRequest

        return schema_id, name, kind, json_schema

    def publish(self):
        res = self.client.post_schema(
            schema_id=self.schema_id,
            name=self.name,
            kind=self.kind,
            json_schema=self.json_schema,
        )

        print(res)

        self.schema_id, self.name, self.kind, self.json_schema = Schema.__unpack__(res)
