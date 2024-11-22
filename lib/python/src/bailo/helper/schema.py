from __future__ import annotations

import logging
from typing import Any, List

from bailo.core.client import Client
from bailo.core.enums import SchemaKind

logger = logging.getLogger(__name__)


class Schema:
    """Represent a schema within Bailo.

    :param client: A client object used to interact with Bailo
    :param schema_id: A unique schema ID
    :param name: Name of schema
    :param description: Description of the schema
    :param kind: Kind of schema, using SchemaKind enum (e.g Model or AccessRequest)
    :param json_schema: Schema JSON
    """

    def __init__(
        self,
        client: Client,
        schema_id: str,
        name: str,
        description: str,
        kind: SchemaKind,
        json_schema: dict[str, Any],
    ) -> None:
        self.client = client
        self.schema_id = schema_id
        self.name = name
        self.description = description
        self.kind = kind
        self.json_schema = json_schema

    @classmethod
    def create(
        cls,
        client: Client,
        schema_id: str,
        name: str,
        description: str,
        kind: SchemaKind,
        json_schema: dict[str, Any],
    ) -> Schema:
        """Build a schema from Bailo and uploads it.

        :param client: A client object used to interact with Bailo
        :param schema_id: A unique schema ID
        :param name: Name of schema
        :param description: Description of schema
        :param kind: Kind of schema, using SchemaKind enum (e.g Model or AccessRequest)
        :param json_schema: Schema JSON
        :return: Schema object
        """
        schema = cls(
            client=client,
            schema_id=schema_id,
            name=name,
            description=description,
            kind=kind,
            json_schema=json_schema,
        )
        res = client.post_schema(
            schema_id=schema_id,
            name=name,
            description=description,
            kind=kind,
            json_schema=json_schema,
        )
        logger.info(f"Schema successfully created on server with ID %s.", schema_id)
        schema.__unpack(res["schema"])

        return schema

    @classmethod
    def from_id(cls, client: Client, schema_id: str) -> Schema:
        """Return an existing schema from Bailo.

        :param client: A client object used to interact with Bailo
        :param schema_id: A unique schema ID
        :return: Schema object
        """
        schema = cls(
            client=client,
            schema_id=schema_id,
            name="temp",
            description="temp",
            kind=SchemaKind.MODEL,
            json_schema={"temp": "temp"},
        )
        res = client.get_schema(schema_id=schema_id)
        logger.info(f"Schema %s successfully retrieved from server.", schema_id)
        schema.__unpack(res["schema"])

        return schema

    @staticmethod
    def get_all_schema_ids(client: Client, kind: SchemaKind | None = None) -> list[str]:
        """Return all schema ids for a given type.

        :param client: A client object used to interact with Bailo
        :param kind: Enum to define schema kind (e.g. Model or AccessRequest), defaults to None
        :return: List of schema IDs
        """
        all_schemas = client.get_all_schemas(kind=kind)
        return [schema["id"] for schema in all_schemas["schemas"]]

    def __unpack(self, res) -> None:
        self.schema_id = res["id"]
        self.name = res["name"]
        self.description = res["description"]
        kind = res["kind"]
        self.json_schema = res["jsonSchema"]

        if kind == "model":
            self.kind = SchemaKind.MODEL
        if kind == "accessRequest":
            self.kind = SchemaKind.ACCESS_REQUEST

        logger.info(f"Attributes for Schema ID %s successfully unpacked.", self.schema_id)
