from __future__ import annotations

from typing import Any

from bailo.core import Client, SchemaKind


class Schema:
    """Represents a schema within Bailo
    :param client: A client object used to interact with Bailo
    :param schema_id: A unique schema ID
    :param name: Name of schema
    :param kind: Kind of schema, using SchemaKind enum (e.g Model or AccessRequest)
    :param json_schema: Schema JSON
    """

    def __init__(
        self,
        client: Client,
        schema_id: str,
        name: str,
        kind: SchemaKind,
        json_schema: dict[str, Any],
    ) -> None:
        self.client = client
        self.schema_id = schema_id
        self.name = name
        self.kind = kind
        self.json_schema = json_schema

    @classmethod
    def create(cls, client: Client, schema_id: str, name: str, kind: SchemaKind, json_schema: dict[str, Any]) -> Schema:
        """Builds a schema from Bailo and uploads it

        :param client: A client object used to interact with Bailo
        :param schema_id: A unique schema ID
        :param name: Name of schema
        :param kind: Kind of schema, using SchemaKind enum (e.g Model or AccessRequest)
        :param json_schema: Schema JSON
        :return: Schema object
        """
        schema = cls(client=client, schema_id=schema_id, name=name, kind=kind, json_schema=json_schema)
        res = client.post_schema(schema_id=schema_id, name=name, kind=kind, json_schema=json_schema)
        schema.__unpack(res["schema"])

        return schema

    @classmethod
    def from_id(cls, client: Client, schema_id: str) -> Schema:
        """Returns an existing schema from Bailo

        :param client: A client object used to interact with Bailo
        :param schema_id: A unique schema ID
        :return: Schema object
        """
        schema = cls(
            client=client,
            schema_id=schema_id,
            name="temp",
            kind=SchemaKind.Model,
            json_schema={"temp": "temp"},
        )
        res = client.get_schema(schema_id=schema_id)
        schema.__unpack(res["schema"])

        return schema

    def __unpack(self, res) -> None:
        print(res)
        self.schema_id = res["id"]
        self.name = res["name"]
        kind = res["kind"]
        self.json_schema = res["jsonSchema"]

        if kind == "model":
            self.kind = SchemaKind.Model
        if kind == "accessRequest":
            self.kind = SchemaKind.AccessRequest
