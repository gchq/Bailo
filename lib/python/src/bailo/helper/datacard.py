from __future__ import annotations

import logging
from typing import Any

from bailo.core.client import Client
from bailo.core.enums import CollaboratorEntry, EntryKind, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.helper.entry import Entry

logger = logging.getLogger(__name__)


class Datacard(Entry):
    """Represent a datacard within Bailo.

    :param client: A client object used to interact with Bailo
    :param datacard_id: A unique ID for the datacard
    :param name: Name of datacard
    :param description: Description of datacard
    :param organisation: Organisation responsible for the model, defaults to None
    :param state: Development readiness of the model, defaults to None
    :param collaborators: list of CollaboratorEntry to define who the model's collaborators (a.k.a. model access) are, defaults to None
    :param visibility: Visibility of datacard, using ModelVisibility enum (e.g Public or Private), defaults to None
    """

    def __init__(
        self,
        client: Client,
        datacard_id: str,
        name: str,
        description: str,
        organisation: str | None = None,
        state: str | None = None,
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
            collaborators=collaborators,
            visibility=visibility,
        )

        self.datacard_id = datacard_id

    @classmethod
    def create(
        cls,
        client: Client,
        name: str,
        description: str,
        organisation: str | None = None,
        state: str | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
        visibility: ModelVisibility | None = None,
    ) -> Datacard:
        """Build a datacard from Bailo and upload it.

        :param client: A client object used to interact with Bailo
        :param name: Name of datacard
        :param description: Description of datacard
        :param organisation: Organisation responsible for the model, defaults to None
        :param state: Development readiness of the model, defaults to None
        :param collaborators: list of CollaboratorEntry to define who the model's collaborators (a.k.a. model access) are, defaults to None
        :param visibility: Visibility of datacard, using ModelVisibility enum (e.g Public or Private), defaults to None
        :return: Datacard object
        """
        res = client.post_model(
            name=name,
            kind=EntryKind.DATACARD,
            description=description,
            visibility=visibility,
            organisation=organisation,
            state=state,
            collaborators=collaborators,
        )
        datacard_id = res["model"]["id"]
        logger.info("Datacard successfully created on server with ID %s.", datacard_id)

        datacard = cls(
            client=client,
            datacard_id=datacard_id,
            name=name,
            description=description,
            organisation=organisation,
            state=state,
            collaborators=collaborators,
            visibility=visibility,
        )

        datacard._unpack(res["model"])

        return datacard

    @classmethod
    def from_id(cls, client: Client, datacard_id: str) -> Datacard:
        """Return an existing datacard from Bailo.

        :param client: A client object used to interact with Bailo
        :param datacard_id: A unique datacard ID
        :return: A datacard object
        """
        res = client.get_model(model_id=datacard_id)["model"]
        if res["kind"] != "data-card":
            raise BailoException(
                f"ID {datacard_id} does not belong to a datacard. Did you mean to use Model.from_id()?"
            )

        logger.info("Datacard %s successfully retrieved from server.", datacard_id)

        datacard = cls(
            client=client,
            datacard_id=datacard_id,
            name=res["name"],
            description=res["description"],
            collaborators=res["collaborators"],
            organisation=res.get("organisation"),
            state=res.get("state"),
        )
        datacard._unpack(res)

        datacard.get_card_latest()

        return datacard

    def update_data_card(self, data_card: dict[str, Any] | None = None) -> None:
        """Upload and retrieve any changes to the datacard on Bailo.

        :param data_card: Datacard dictionary, defaults to None

        ..note:: If a datacard is not provided, the current datacard attribute value is used
        """
        self._update_card(card=data_card)

    @property
    def data_card(self):
        return self._card

    @data_card.setter
    def data_card(self, value):
        self._card = value

    @property
    def data_card_version(self):
        return self._card_version

    @data_card_version.setter
    def data_card_version(self, value):
        self._card_version = value

    @property
    def data_card_schema(self):
        return self._card_schema

    @data_card_schema.setter
    def data_card_schema(self, value):
        self._card_schema = value
