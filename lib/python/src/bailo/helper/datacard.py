from __future__ import annotations

import logging
from typing import Any, ClassVar

from bailo.core.client import Client
from bailo.core.entry import Entry
from bailo.core.enums import CollaboratorEntry, EntryKind, ModelVisibility

logger = logging.getLogger(__name__)


class Datacard(Entry):
    """Represent a datacard within Bailo.

    :param client: A client object used to interact with Bailo
    :param datacard_id: A unique ID for the datacard
    :param name: Name of datacard
    :param description: Description of datacard
    :param organisation: Organisation responsible for the datacard, defaults to None
    :param state: Development readiness of the datacard, defaults to None
    :param tags: Tags to assign to the datacard, defaults to None
    :param collaborators: List of CollaboratorEntry to define who the datacard's collaborators (a.k.a. model access) are, defaults to None
    :param visibility: Visibility of datacard, using ModelVisibility enum (e.g Public or Private), defaults to None
    """

    entry_kind: ClassVar[EntryKind] = EntryKind.DATACARD
    _id_alias: ClassVar[str] = "datacard_id"

    def __init__(
        self,
        client: Client,
        datacard_id: str,
        name: str,
        description: str,
        organisation: str | None = None,
        state: str | None = None,
        tags: list[str] | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
        visibility: ModelVisibility | None = None,
    ) -> None:
        super().__init__(
            client=client,
            id=datacard_id,
            name=name,
            description=description,
            kind=EntryKind.DATACARD,
            organisation=organisation,
            state=state,
            tags=tags,
            collaborators=collaborators,
            visibility=visibility,
        )

    @classmethod
    def from_id(cls, client: Client, datacard_id: str) -> Datacard:
        """Return an existing datacard from Bailo.

        :param client: A client object used to interact with Bailo
        :param datacard_id: A unique datacard ID
        :return: A datacard object
        """
        return cls._from_id(client, datacard_id)

    def update_data_card(self, data_card: dict[str, Any] | None = None) -> None:
        """Upload and retrieve any changes to the datacard on Bailo.

        :param data_card: Datacard dictionary, defaults to None

        .. note:: If a datacard is not provided, the current datacard attribute value is used
        """
        self._update_card(card=data_card)

    @property
    def data_card(self) -> dict[str, Any] | None:
        """Get the datacard metadata.

        :return: Datacard as a dictionary.
        """
        return self.card

    @data_card.setter
    def data_card(self, value: dict[str, Any] | None) -> None:
        """Sets the datacard metadata.

        :param value: The new datacard metadata as a dictionary.
        """
        self.card = value

    @property
    def data_card_version(self) -> int | None:
        """Get the version of the datacard.

        :return: Datacard version.
        """
        return self.card_version

    @data_card_version.setter
    def data_card_version(self, value: int | None) -> None:
        """Set the version of the datacard.

        :param value: The version to set.
        """
        self.card_version = value

    @property
    def data_card_schema(self) -> str | None:
        """Get the schema ID associated with the datacard.

        :return: Schema ID of the datacard.
        """
        return self.card_schema

    @data_card_schema.setter
    def data_card_schema(self, value: str | None) -> None:
        """Set the schema ID associated with the datacard.

        :param value: The Schema ID to set.
        """
        self.card_schema = value
