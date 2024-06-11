from __future__ import annotations

from typing import Any
import logging

from bailo.core.client import Client
from bailo.core.enums import EntryKind, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.helper.entry import Entry

logger = logging.getLogger(__name__)


class Datacard(Entry):
    """Represent a datacard within Bailo.

    :param client: A client object used to interact with Bailo
    :param datacard_id: A unique ID for the datacard
    :param name: Name of datacard
    :param description: Description of datacard
    :param visibility: Visibility of datacard, using ModelVisibility enum (e.g Public or Private), defaults to None
    """

    def __init__(
        self,
        client: Client,
        datacard_id: str,
        name: str,
        description: str,
        visibility: ModelVisibility | None = None,
    ) -> None:
        super().__init__(
            client=client,
            id=datacard_id,
            name=name,
            description=description,
            kind=EntryKind.DATACARD,
            visibility=visibility,
        )

        self.datacard_id = datacard_id

    @classmethod
    def create(
        cls,
        client: Client,
        name: str,
        description: str,
        team_id: str,
        visibility: ModelVisibility | None = None,
    ) -> Datacard:
        """Build a datacard from Bailo and upload it.

        :param client: A client object used to interact with Bailo
        :param name: Name of datacard
        :param description: Description of datacard
        :param team_id: A unique team ID
        :param visibility: Visibility of datacard, using ModelVisibility enum (e.g Public or Private), defaults to None
        :return: Datacard object
        """
        res = client.post_model(
            name=name, kind=EntryKind.DATACARD, description=description, team_id=team_id, visibility=visibility
        )
        datacard_id = res["model"]["id"]
        logger.info(f"Datacard successfully created on server with ID %s.", datacard_id)

        datacard = cls(
            client=client,
            datacard_id=datacard_id,
            name=name,
            description=description,
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

        logger.info(f"Datacard %s successfully retrieved from server.", datacard_id)

        datacard = cls(
            client=client,
            datacard_id=datacard_id,
            name=res["name"],
            description=res["description"],
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
