from __future__ import annotations

from typing import Any

from bailo.core.client import Client
from bailo.core.enums import EntryKind, ModelVisibility
from bailo.core.exceptions import BailoException


class Entry:
    def __init__(
        self,
        client: Client,
        id: str,
        name: str,
        description: str,
        kind: EntryKind,
        visibility: ModelVisibility | None = None,
    ) -> None:
        self.client = client

        self.id = id
        self.name = name
        self.description = description
        self.kind = kind
        self.visibility = visibility

        self.card = None
        self.card_version = None
        self.card_schema = None

    def update(self) -> None:
        """Upload and retrieve any changes to the entry summary on Bailo."""
        res = self.client.patch_model(
            model_id=self.id,
            name=self.name,
            kind=self.kind,
            description=self.description,
            visibility=self.visibility,
        )
        self.__unpack(res["model"])

    def card_from_schema(self, schema_id: str) -> None:
        """Create a card using a schema on Bailo.

        :param schema_id: A unique schema ID
        """
        res = self.client.model_card_from_schema(model_id=self.id, schema_id=schema_id)
        self.__unpack_card(res["card"])

    def card_from_template(self):
        """Create a card using a template (not yet implemented).

        :raises NotImplementedError: Not implemented error
        """
        raise NotImplementedError

    def get_card_latest(self) -> None:
        """Get the latest card from Bailo."""
        res = self.client.get_model(model_id=self.id)
        if "card" in res["model"]:
            self.__unpack_card(res["model"]["card"])
        else:
            raise BailoException(f"A model card doesn't exist for model {self.id}")

    def get_card_revision(self, version: str) -> None:
        """Get a specific entry card revision from Bailo.

        :param version: Entry card version
        """
        res = self.client.get_model_card(model_id=self.id, version=version)
        self.__unpack_card(res["modelCard"])

    def get_roles(self):
        """Get all roles for the entry.

        :return: List of roles
        """
        res = self.client.get_model_roles(model_id=self.id)

        return res["roles"]

    def get_user_roles(self):
        """Get all user roles for the entry.

        :return: List of user roles
        """
        res = self.client.get_model_user_roles(model_id=self.id)

        return res["roles"]

    def __update_card(self, card: dict[str, Any] | None = None) -> None:
        if card is None:
            card = self.card

        res = self.client.put_model_card(model_id=self.id, metadata=card)
        self.__unpack_card(res["card"])

    def __unpack(self, res):
        self.id = res["id"]
        self.name = res["name"]
        self.description = res["description"]

        if res["visibility"] == "private":
            self.visibility = ModelVisibility.PRIVATE
        else:
            self.visibility = ModelVisibility.PUBLIC

    def __unpack_card(self, res):
        self.card_version = res["version"]
        self.card_schema = res["schemaId"]

        try:
            self.card = res["metadata"]
        except KeyError:
            self.card = None
