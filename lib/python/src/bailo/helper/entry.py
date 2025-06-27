from __future__ import annotations

import logging
import warnings
from typing import Any

from bailo.core.client import Client
from bailo.core.enums import CollaboratorEntry, EntryKind, MinimalSchema, ModelVisibility

logger = logging.getLogger(__name__)


class Entry:
    """Represent an entry in Bailo

    :param client: A client object used to interact with Bailo
    :param id: A unique ID for the entry
    :param name: Name of the entry
    :param description: Description of the entry
    :param kind: Represents whether entry type (i.e. Model or Datacard)
    :param visibility: Visibility of model, using ModelVisibility enum (i.e. Public or Private), defaults to None
    :param organisation: Organisation responsible for the model, defaults to None
    :param state: Development readiness of the model, defaults to None
    :param collaborators: list of CollaboratorEntry to define who the model's collaborators (a.k.a. model access) are, defaults to None
    """

    def __init__(
        self,
        client: Client,
        id: str,
        name: str,
        description: str,
        kind: EntryKind,
        visibility: ModelVisibility | None = None,
        organisation: str | None = None,
        state: str | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
    ) -> None:
        self.client = client

        self.id = id
        self.name = name
        self.description = description
        self.kind = kind
        self.visibility = visibility
        self.organisation = organisation
        self.state = state
        self.collaborators = collaborators

        self._card = None
        self._card_version = None
        self._card_schema = None

    def update(self) -> None:
        """Upload and retrieve any changes to the entry summary on Bailo."""
        res = self.client.patch_model(
            model_id=self.id,
            name=self.name,
            kind=self.kind,
            description=self.description,
            visibility=self.visibility,
            organisation=self.organisation,
            state=self.state,
            collaborators=self.collaborators,
        )
        self._unpack(res["model"])

        logger.info("ID %s updated locally and on server.", self.id)

    def card_from_schema(self, schema_id: str | None = None) -> None:
        """Create a card using a schema on Bailo.

        :param schema_id: A unique schema ID, defaults to None. If None, either minimal-general-v10 or minimal-data-card-v10 is used
        """
        if schema_id is None:
            if self.kind == EntryKind.MODEL:
                schema_id = MinimalSchema.MODEL
            elif self.kind == EntryKind.DATACARD:
                schema_id = MinimalSchema.DATACARD
            else:
                raise NotImplementedError(f"No default schema set for {self.kind=}")

        res = self.client.model_card_from_schema(model_id=self.id, schema_id=schema_id)
        self.__unpack_card(res["card"])

        logger.info("Card for ID %s successfully created using schema ID %s.", self.id, schema_id)

    def card_from_template(self, template_id: str) -> None:
        """Create a card using a template (not yet implemented)."""
        res = self.client.model_card_from_template(model_id=self.id, template_id=template_id)
        self.__unpack_card(res["card"])

        logger.info("Card for ID %s successfully created using template ID %s", self.id, template_id)

    def get_card_latest(self) -> None:
        """Get the latest card from Bailo."""
        res = self.client.get_model(model_id=self.id)
        if "card" in res["model"]:
            self.__unpack_card(res["model"]["card"])
            logger.info("Latest card for ID %s successfully retrieved.", self.id)
        else:
            warnings.warn(
                f"ID {self.id} does not have any associated cards. If needed, create a card with the .card_from_schema() method."
            )

    def get_card_revision(self, version: str) -> None:
        """Get a specific entry card revision from Bailo.

        :param version: Entry card version
        """
        res = self.client.get_model_card(model_id=self.id, version=version)
        self.__unpack_card(res["modelCard"])

        logger.info("Card version %s for ID %s successfully retrieved.", version, self.id)

    def get_roles(self):
        """Get all roles for the entry.

        :return: List of roles
        """
        res = self.client.get_model_roles(model_id=self.id)

        return res["roles"]

    def _update_card(self, card: dict[str, Any] | None = None) -> None:
        if card is None:
            card = self._card

        res = self.client.put_model_card(model_id=self.id, metadata=card)
        self.__unpack_card(res["card"])

        logger.info("Card for %s successfully updated on server.", self.id)

    def _unpack(self, res):
        self.id = res["id"]
        self.name = res["name"]
        self.description = res["description"]

        if res["visibility"] == "private":
            self.visibility = ModelVisibility.PRIVATE
        else:
            self.visibility = ModelVisibility.PUBLIC

        logger.info("Attributes for ID %s successfully unpacked.", self.id)

    def __unpack_card(self, res):
        self._card_version = res["version"]
        self._card_schema = res["schemaId"]

        try:
            self._card = res["metadata"]
        except KeyError:
            self._card = None

        logger.info("Card attributes for ID %s successfully unpacked.", self.id)
