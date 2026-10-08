from __future__ import annotations

import logging
import warnings
from typing import Any, ClassVar

from bailo.core.client import Client
from bailo.core.entry import Entry
from bailo.core.enums import CollaboratorEntry, EntryKind, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.helper.entry import ReleaseMixin

logger = logging.getLogger(__name__)


class MirroredModel(ReleaseMixin, Entry):
    """Represent a mirrored model within Bailo.

    :param client: A client object used to interact with Bailo
    :param model_id: A unique ID for the mirrored model
    :param name: Name of mirrored model
    :param description: Description of mirrored model
    :param sourceModelId: Used for linking a mirrored model to its source model
    :param organisation: Organisation responsible for the mirrored model, defaults to None
    :param state: Development readiness of the mirrored model, defaults to None
    :param tags: Tags to assign to the mirrored model, defaults to None
    :param collaborators: List of CollaboratorEntry to define who the mirrored model's collaborators (a.k.a. mirrored model access) are, defaults to None
    :param visibility: Visibility of the mirrored model, using ModelVisibility enum (e.g Public or Private), defaults to None
    """

    entry_kind: ClassVar[EntryKind] = EntryKind.MIRRORED_MODEL
    _id_alias: ClassVar[str] = "model_id"
    # Search summaries do not carry settings.mirror.sourceModelId, so each result must be refetched.
    _search_refetches_each_result: ClassVar[bool] = True
    _extra_create_args: ClassVar[tuple[str, ...]] = ("sourceModelId",)

    def __init__(
        self,
        client: Client,
        model_id: str,
        name: str,
        description: str,
        sourceModelId: str,
        organisation: str | None = None,
        state: str | None = None,
        tags: list[str] | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
        visibility: ModelVisibility | None = None,
    ) -> None:
        super().__init__(
            client=client,
            id=model_id,
            name=name,
            description=description,
            kind=EntryKind.MIRRORED_MODEL,
            visibility=visibility,
            organisation=organisation,
            state=state,
            tags=tags,
            collaborators=collaborators,
        )
        self.sourceModelId = sourceModelId
        self._original_source_model_id = sourceModelId

        # The backend's `mirroredCard` is the card synced from the source model and is held in
        # `_card`. The backend's own `card` is the locally editable additional information.
        self._additional_information_card: dict[str, Any] | None = None
        self._additional_information_card_version: int | None = None

    @classmethod
    def create(
        cls,
        client: Client,
        name: str,
        description: str,
        sourceModelId: str,
        organisation: str | None = None,
        state: str | None = None,
        tags: list[str] | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
        visibility: ModelVisibility | None = None,
        **extra: Any,
    ) -> MirroredModel:
        """Build a mirrored model from Bailo and upload it.

        :param client: A client object used to interact with Bailo
        :param name: Name of mirrored model
        :param description: Description of mirrored model
        :param sourceModelId: Used for linking a mirrored model to its source model
        :param organisation: Organisation responsible for the mirrored model, defaults to None
        :param state: Development readiness of the mirrored model, defaults to None
        :param tags: Tags to assign to the mirrored model, defaults to None
        :param collaborators: List of CollaboratorEntry to define who the mirrored model's collaborators (a.k.a. model access) are, defaults to None
        :param visibility: Visibility of the mirrored model, using ModelVisibility enum (e.g Public or Private), defaults to None
        :param extra: Rejected by :meth:`Entry.create`, so that an unsupported argument raises the same BailoException here as it does for other entry kinds
        :raises BailoException: If an argument not accepted by this entry kind is given
        :return: MirroredModel object
        """
        return super().create(
            client=client,
            name=name,
            description=description,
            organisation=organisation,
            state=state,
            tags=tags,
            collaborators=collaborators,
            visibility=visibility,
            sourceModelId=sourceModelId,
            **extra,
        )

    @classmethod
    def from_id(cls, client: Client, model_id: str) -> MirroredModel:
        """Return an existing mirrored model from Bailo.

        :param client: A client object used to interact with Bailo
        :param model_id: A unique mirrored model ID
        :return: A mirrored model object
        """
        return cls._from_id(client, model_id)

    @classmethod
    def _create_payload_extras(cls, **kwargs: Any) -> dict[str, Any]:
        """Return the mirror-specific arguments for the create request.

        :param kwargs: Subclass-specific arguments passed to :meth:`create`.
        :return: Dictionary containing the source model ID.
        """
        return {"sourceModelId": kwargs["sourceModelId"]}

    @classmethod
    def _init_kwargs_from_response(cls, res: dict[str, Any]) -> dict[str, Any]:
        """Extract the source model ID from an API response.

        :param res: Response dictionary containing model information.
        :raises BailoException: If the response has no mirror source model ID.
        :return: Dictionary containing the source model ID.
        """
        source_model_id = res.get("settings", {}).get("mirror", {}).get("sourceModelId")
        if source_model_id is None:
            raise BailoException(f"Mirrored model {res.get('id')} has no settings.mirror.sourceModelId.")

        return {"sourceModelId": source_model_id}

    def update(self) -> None:
        """Upload and retrieve any changes to the mirrored model summary on Bailo.

        Merges the sourceModelId into settings when it has changed, then delegates to the base update.
        """
        if self.sourceModelId != self._original_source_model_id:
            if self.settings is None:
                self.settings = {}
            self.settings.setdefault("mirror", {})["sourceModelId"] = self.sourceModelId
        super().update()
        self._original_source_model_id = self.sourceModelId

    def _unpack(self, res):
        """Update mirrored model attributes from API response.

        :param res: Response dictionary containing model information.
        """
        super()._unpack(res)
        source_id = res.get("settings", {}).get("mirror", {}).get("sourceModelId", self.sourceModelId)
        self.sourceModelId = source_id
        self._original_source_model_id = source_id

    def update_model_card(self, model_card: dict[str, Any] | None = None) -> None:
        """Upload and retrieve any changes to the editable mirrored model card on Bailo.

        :param model_card: Model card dictionary, defaults to None

        .. note:: If a model card is not provided, the current additional information value is used
        """
        self._update_card(card=model_card)

    def _update_card(self, card: dict[str, Any] | None = None) -> None:
        """Update the editable additional information for this mirrored model on the Bailo server.

        The card synced from the source model is read only, so the default falls back to the
        additional information rather than :attr:`Entry._card`.

        :param card: Metadata dictionary to update, defaults to None to use the additional information.
        """
        super()._update_card(card=card if card is not None else self._additional_information_card)

    def get_card_latest(self) -> None:
        """Get the latest card from Bailo."""
        res = self.client.get_model(model_id=self.id)
        if "card" in res["model"]:
            self._unpack_card(res["model"]["card"])
            logger.info("Latest additional information for ID %s successfully retrieved.", self.id)
        else:
            warnings.warn(f"ID {self.id} does not have any associated additional information.", stacklevel=2)
        if "mirroredCard" in res["model"]:
            self._unpack_card(res["model"]["mirroredCard"], True)
            logger.info("Latest card for ID %s successfully retrieved.", self.id)
        else:
            warnings.warn(f"ID {self.id} does not have any associated model card.", stacklevel=2)

    def _unpack_card(self, res, mirrored=False) -> None:
        """Unpack a card from an API response into the mirrored or additional information slot.

        :param res: Card-related dictionary from the API response.
        :param mirrored: True for the card synced from the source model, False for the editable one.
        """
        if mirrored:
            super()._unpack_card(res)
        else:
            self._additional_information_card_version = res["version"]

            try:
                self._additional_information_card = res["metadata"]
            except KeyError:
                self._additional_information_card = None

    @property
    def model_card(self) -> dict[str, Any]:
        """Get the data of the model card.

        :return: Model card data.
        """
        return {"card": self._card, "additional_information": self._additional_information_card}

    @property
    def model_card_version(self) -> dict[str, int | None]:
        """Get the version of the mirrored model card.

        :return: Model card version.
        """
        return {
            "card": self._card_version,
            "additional_information": self._additional_information_card_version,
        }

    @property
    def model_card_schema(self) -> str | None:
        """Get the schema of the mirrored model card.

        :return: Model card schema.
        """
        return self.card_schema
