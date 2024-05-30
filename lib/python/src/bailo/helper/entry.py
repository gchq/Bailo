from __future__ import annotations

from typing import Any
import logging

from bailo.core.client import Client
from bailo.core.enums import EntryKind, ModelVisibility
from bailo.core.exceptions import BailoException

logger = logging.getLogger(__name__)


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

        self._card = None
        self._card_version = None
        self._card_schema = None

        logger.debug("Local base Entry object created successfully.")

    def update(self) -> None:
        """Upload and retrieve any changes to the entry summary on Bailo."""
        res = self.client.patch_model(
            model_id=self.id,
            name=self.name,
            kind=self.kind,
            description=self.description,
            visibility=self.visibility,
        )
        self._unpack(res["model"])

        logger.info(f"ID {self.id} updated locally and on server.")

    def card_from_schema(self, schema_id: str) -> None:
        """Create a card using a schema on Bailo.

        :param schema_id: A unique schema ID
        """
        res = self.client.model_card_from_schema(model_id=self.id, schema_id=schema_id)
        self.__unpack_card(res["card"])

        logger.info(f"Card for ID {self.id} successfully created using schema ID {schema_id}.")

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
            logger.info(f"Latest card for ID {self.id} successfully retrieved.")
        else:
            raise BailoException(f"A model card doesn't exist for model {self.id}")

    def get_card_revision(self, version: str) -> None:
        """Get a specific entry card revision from Bailo.

        :param version: Entry card version
        """
        res = self.client.get_model_card(model_id=self.id, version=version)
        self.__unpack_card(res["modelCard"])

        logger.info(f"Card version {version} for ID {self.id} successfully retrieved.")

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

    def _update_card(self, card: dict[str, Any] | None = None) -> None:
        if card is None:
            card = self._card

        res = self.client.put_model_card(model_id=self.id, metadata=card)
        self.__unpack_card(res["card"])

        logger.info(f"Card for {self.id} successfully updated on server.")

    def _unpack(self, res):
        self.id = res["id"]
        self.name = res["name"]
        self.description = res["description"]

        if res["visibility"] == "private":
            self.visibility = ModelVisibility.PRIVATE
        else:
            self.visibility = ModelVisibility.PUBLIC

        logger.debug(f"Attributes for ID {self.id} successfully unpacked.")

    def __unpack_card(self, res):
        self._card_version = res["version"]
        self._card_schema = res["schemaId"]

        try:
            self._card = res["metadata"]
        except KeyError:
            self._card = None

        logger.debug(f"Card attributes for ID {self.id} successfully unpacked.")
