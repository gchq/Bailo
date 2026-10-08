"""Shared base class for the entry types exposed by the helper package.

``Entry`` mirrors ``ModelInterface`` in ``backend/src/models/Model.ts``. The following
deviations from the backend model are current and intentional:

* ``Role`` has no counterpart to ``SystemRoles.None`` (``''``). That value is a sentinel used by
  the backend to mean "no role", not a role that can be assigned to a collaborator.
* ``ModelInterface.createdAt``, ``updatedAt`` and ``deleted`` are not surfaced as attributes.
* ``ModelCardInterface.createdBy`` and ``mirrored`` are not surfaced as attributes.
* ``Settings.ungovernedAccess``, ``Settings.allowTemplating`` and
  ``Settings.mirror.destinationModelId`` are reachable only through the untyped
  :attr:`Entry.settings` dictionary. Only ``mirror.sourceModelId`` has a named accessor, on
  :class:`~bailo.helper.mirroredModel.MirroredModel`.
* ``EntryKind.UNTRUSTED_MODEL`` and ``EntryKind.MIRRORED_DATACARD`` have no helper class, and
  :meth:`Entry.card_from_schema` has no default schema for them.
"""

from __future__ import annotations

import logging
import warnings
from abc import ABC
from typing import Any, ClassVar, TypeVar

from bailo.core.client import Client
from bailo.core.enums import CollaboratorEntry, EntryKind, MinimalSchema, ModelVisibility
from bailo.core.exceptions import BailoException

logger = logging.getLogger(__name__)

EntryT = TypeVar("EntryT", bound="Entry")


class Entry(ABC):
    """Represent an entry in Bailo

    :param client: A client object used to interact with Bailo
    :param id: A unique ID for the entry
    :param name: Name of the entry
    :param description: Description of the entry
    :param kind: Represents whether entry type (i.e. Model, Mirrored Model or Datacard), defaults to the subclass kind
    :param visibility: Visibility of entry, using ModelVisibility enum (i.e. Public or Private), defaults to None
    :param organisation: Organisation responsible for the entry, defaults to None
    :param state: Development readiness of the entry, defaults to None
    :param tags: Tags to assign to the entry, defaults to None
    :param collaborators: List of CollaboratorEntry to define who the entry's collaborators (a.k.a. entry access) are, defaults to None
    """

    #: The entry kind represented by this subclass.
    entry_kind: ClassVar[EntryKind]
    #: Subclass-specific alias for :attr:`id` (e.g. ``model_id``), exposed as a property.
    _id_alias: ClassVar[str | None] = None
    #: Whether :meth:`search` must fetch each result individually to populate all attributes.
    _search_refetches_each_result: ClassVar[bool] = False
    #: Subclass-specific arguments accepted by :meth:`create` beyond the standard ones.
    _extra_create_args: ClassVar[tuple[str, ...]] = ()

    def __init__(
        self,
        client: Client,
        id: str,
        name: str,
        description: str,
        kind: EntryKind | None = None,
        visibility: ModelVisibility | None = None,
        organisation: str | None = None,
        state: str | None = None,
        tags: list[str] | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
    ) -> None:
        if type(self) is Entry:
            raise TypeError("Entry is a base class and cannot be instantiated directly.")

        self.client = client

        self.id = id
        self.name = name
        self.description = description
        self.kind = kind if kind is not None else type(self).entry_kind
        self.visibility = visibility
        self.organisation = organisation
        self.state = state
        self.tags = tags
        self.collaborators = collaborators
        self.settings: dict[str, Any] | None = None

        self._card: dict[str, Any] | None = None
        self._card_version: int | None = None
        self._card_schema: str | None = None

    def __init_subclass__(cls, **kwargs: Any) -> None:
        """Check the subclass sets ``entry_kind`` and generate its ID alias property (e.g. ``model_id``).

        :param kwargs: Keyword arguments forwarded to the parent implementation.
        :raises TypeError: If a concrete subclass does not define ``entry_kind``.
        """
        super().__init_subclass__(**kwargs)

        if not hasattr(cls, "entry_kind"):
            raise TypeError(f"{cls.__name__} must define an 'entry_kind' class attribute.")

        alias = cls.__dict__.get("_id_alias")
        if alias is not None:
            setattr(
                cls,
                alias,
                property(
                    lambda self: self.id,
                    lambda self, value: setattr(self, "id", value),
                    doc="Alias for :attr:`Entry.id`, kept for backwards compatibility.",
                ),
            )

    @classmethod
    def create(
        cls: type[EntryT],
        client: Client,
        name: str,
        description: str,
        organisation: str | None = None,
        state: str | None = None,
        tags: list[str] | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
        visibility: ModelVisibility | None = None,
        **extra: Any,
    ) -> EntryT:
        """Build an entry from Bailo and upload it.

        :param client: A client object used to interact with Bailo
        :param name: Name of the entry
        :param description: Description of the entry
        :param organisation: Organisation responsible for the entry, defaults to None
        :param state: Development readiness of the entry, defaults to None
        :param tags: Tags to assign to the entry, defaults to None
        :param collaborators: List of CollaboratorEntry to define who the entry's collaborators (a.k.a. entry access) are, defaults to None
        :param visibility: Visibility of entry, using ModelVisibility enum (e.g Public or Private), defaults to None
        :param extra: Subclass-specific arguments (e.g. ``sourceModelId``)
        :raises BailoException: If an argument not accepted by this entry kind is given
        :return: Entry object
        """
        unexpected = set(extra) - set(cls._extra_create_args)
        if unexpected:
            accepted = ", ".join(cls._extra_create_args) or "none"
            raise BailoException(
                f"{cls.__name__}.create() got unexpected argument(s) {', '.join(sorted(unexpected))}. "
                f"Arguments accepted in addition to the standard ones: {accepted}."
            )

        res = client.post_model(
            name=name,
            kind=cls.entry_kind,
            description=description,
            visibility=visibility,
            organisation=organisation,
            state=state,
            tags=tags,
            collaborators=collaborators,
            **cls._create_payload_extras(**extra),
        )
        entry_id = res["model"]["id"]
        logger.info("%s successfully created on server with ID %s.", cls.__name__, entry_id)

        entry = cls(
            client=client,
            name=name,
            description=description,
            visibility=visibility,
            organisation=organisation,
            state=state,
            tags=tags,
            collaborators=collaborators,
            **cls._id_kwarg(entry_id),
            **extra,
        )

        entry._unpack(res["model"])

        return entry

    @classmethod
    def _from_id(cls: type[EntryT], client: Client, entry_id: str) -> EntryT:
        """Return an existing entry from Bailo.

        Subclasses expose this as ``from_id`` with their own ID parameter name.

        :param client: A client object used to interact with Bailo
        :param entry_id: A unique entry ID
        :return: An entry object
        """
        res = client.get_model(model_id=entry_id)["model"]
        kind = res.get("kind")
        if kind != cls.entry_kind:
            raise BailoException(f"ID {entry_id} is of kind '{kind}', not '{cls.entry_kind}'.")

        logger.info("%s %s successfully retrieved from server.", cls.__name__, entry_id)

        entry = cls(
            client=client,
            name=res["name"],
            description=res["description"],
            collaborators=res["collaborators"],
            organisation=res.get("organisation"),
            state=res.get("state"),
            tags=res.get("tags"),
            **cls._id_kwarg(entry_id),
            **cls._init_kwargs_from_response(res),
        )

        entry._unpack(res)
        entry.get_card_latest()

        return entry

    @classmethod
    def search(
        cls: type[EntryT],
        client: Client,
        task: str | None = None,
        libraries: list[str] | None = None,
        filters: list[str] | None = None,
        search: str = "",
        organisations: list[str] | None = None,
        states: list[str] | None = None,
        allow_templating: bool | None = None,
        schema_id: str | None = None,
        admin_access: bool | None = None,
        peers: list[str] | None = None,
        title_only: bool | None = None,
    ) -> list[EntryT]:
        """Return a list of entry objects from Bailo, based on search parameters.

        :param client: A client object used to interact with Bailo
        :param task: Entry task (e.g. image classification), defaults to None
        :param libraries: Entry library (e.g. TensorFlow), defaults to None
        :param filters: List of collaborator role filters. Special value `"mine"` restricts results to
            entries where the current user is a collaborator. Otherwise, values are treated as collaborator
            roles, defaults to None
        :param search: Free-text search string. Always performs a partial, case-insensitive match against
            the entry name. If `title_only` is False, a full-text search across entry content is also
            performed, defaults to ""
        :param organisations: List of organisation identifiers to restrict results, defaults to None
        :param states: List of entry lifecycle states to restrict results, defaults to None
        :param allow_templating: If True, restricts results to entries with templating enabled, defaults to None
        :param schema_id: Schema ID to restrict results to entries using that schema, defaults to None
        :param admin_access: If True, returns entries requiring admin access. The caller must
            have the Admin role or the request will be rejected by the backend, defaults to None
        :param peers: List of peer identifiers to include remote search results from, defaults to None
        :param title_only: If True, limits searching to entry titles only and disables
            full-text search, defaults to None
        :return: List of entry objects
        """
        res = client.get_models(
            task=task,
            libraries=libraries,
            filters=filters,
            search=search,
            kind=cls.entry_kind,
            organisations=organisations,
            states=states,
            allow_templating=allow_templating,
            schema_id=schema_id,
            admin_access=admin_access,
            peers=peers,
            title_only=title_only,
        )
        entries: list[EntryT] = []

        for summary in res["models"]:
            # Search summaries omit some attributes, so refetch when a subclass needs them.
            entry_data = (
                client.get_model(model_id=summary["id"])["model"] if cls._search_refetches_each_result else summary
            )

            entry = cls(
                client=client,
                name=summary["name"],
                description=summary["description"],
                collaborators=summary["collaborators"],
                organisation=summary.get("organisation"),
                state=summary.get("state"),
                tags=summary.get("tags"),
                **cls._id_kwarg(summary["id"]),
                **cls._init_kwargs_from_response(entry_data),
            )
            entry._unpack(entry_data)

            if cls._search_refetches_each_result:
                entry.get_card_latest()
            elif "card" in entry_data:
                entry._unpack_card(entry_data["card"])

            entries.append(entry)

        return entries

    @classmethod
    def _id_kwarg(cls, entry_id: str) -> dict[str, str]:
        """Return the ID as the keyword argument this subclass' constructor expects.

        :param entry_id: A unique entry ID.
        :return: Dictionary mapping the subclass ID parameter name to the given ID.
        """
        return {cls._id_alias or "id": entry_id}

    @classmethod
    def _create_payload_extras(cls, **kwargs: Any) -> dict[str, Any]:
        """Return additional arguments for the create request.

        :param kwargs: Subclass-specific arguments passed to :meth:`create`.
        :return: Dictionary of additional arguments for ``client.post_model``.
        """
        return {}

    @classmethod
    def _init_kwargs_from_response(cls, res: dict[str, Any]) -> dict[str, Any]:
        """Return additional constructor arguments derived from an API response.

        :param res: Response dictionary containing entry information.
        :return: Dictionary of additional constructor arguments.
        """
        return {}

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
            tags=self.tags,
            collaborators=self.collaborators,
            settings=self.settings,
        )
        self._unpack(res["model"])

        logger.info("ID %s updated locally and on server.", self.id)

    def delete(self) -> Any:
        """Delete the entry from Bailo."""
        res = self.client.delete_model(self.id)
        logger.info("Model %s successfully deleted.", self.id)

        return res

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
        self._unpack_card(res["card"])

        logger.info("Card for ID %s successfully created using schema ID %s.", self.id, schema_id)

    def card_from_template(self, template_id: str) -> None:
        """Create a card using a template.

        :param template_id: Previous model's unique ID to be used as template
        """
        res = self.client.model_card_from_template(model_id=self.id, template_id=template_id)
        self._unpack_card(res["card"])

        logger.info("Card for ID %s successfully created using template ID %s", self.id, template_id)

    def get_card_latest(self) -> None:
        """Get the latest card from Bailo."""
        res = self.client.get_model(model_id=self.id)
        if "card" in res["model"]:
            self._unpack_card(res["model"]["card"])
            logger.info("Latest card for ID %s successfully retrieved.", self.id)
        else:
            warnings.warn(
                f"ID {self.id} does not have any associated cards. If needed, create a card with the .card_from_schema() method.",
                stacklevel=2,
            )

    def get_card_revision(self, version: str) -> None:
        """Get a specific entry card revision from Bailo.

        :param version: Entry card version
        """
        res = self.client.get_model_card(model_id=self.id, version=version)
        self._unpack_card(res["modelCard"])

        logger.info("Card version %s for ID %s successfully retrieved.", version, self.id)

    def get_roles(self) -> list[dict[str, Any]]:
        """Get all roles for the entry.

        :return: List of roles
        """
        res = self.client.get_model_roles(model_id=self.id)

        return res["roles"]

    @property
    def card(self) -> dict[str, Any] | None:
        """Get the metadata of the card.

        :return: Card metadata.
        """
        return self._card

    @card.setter
    def card(self, value: dict[str, Any] | None) -> None:
        """Set the metadata of the card.

        :param value: The metadata to set.
        """
        self._card = value

    @property
    def card_version(self) -> int | None:
        """Get the version of the card.

        :return: Card version.
        """
        return self._card_version

    @card_version.setter
    def card_version(self, value: int | None) -> None:
        """Set the version of the card.

        :param value: The version to set.
        """
        self._card_version = value

    @property
    def card_schema(self) -> str | None:
        """Get the schema ID of the card.

        :return: Card schema ID.
        """
        return self._card_schema

    @card_schema.setter
    def card_schema(self, value: str | None) -> None:
        """Set the schema ID of the card.

        :param value: The schema ID to set.
        """
        self._card_schema = value

    def _update_card(self, card: dict[str, Any] | None = None) -> None:
        """Update the card metadata for this entry on the Bailo server.

        :param card: Metadata dictionary to update, defaults to None to use existing card.
        """
        if card is None:
            card = self._card

        res = self.client.put_model_card(model_id=self.id, metadata=card)
        self._unpack_card(res["card"])

        logger.info("Card for %s successfully updated on server.", self.id)

    def _unpack(self, res):
        """Update entry attributes from API response.

        :param res: Response dictionary containing entry information.
        """
        self.id = res["id"]
        self.name = res["name"]
        self.description = res["description"]

        if res["visibility"] == "private":
            self.visibility = ModelVisibility.PRIVATE
        else:
            self.visibility = ModelVisibility.PUBLIC

        if "kind" in res:
            self.kind = EntryKind(res["kind"])

        self.organisation = res.get("organisation", self.organisation)
        self.state = res.get("state", self.state)
        self.tags = res.get("tags", self.tags)
        self.collaborators = res.get("collaborators", self.collaborators)
        self.settings = res.get("settings", self.settings)

        logger.info("Attributes for ID %s successfully unpacked.", self.id)

    def _unpack_card(self, res):
        """Private method. Unpack card metadata, version, and schema ID from API response.

        :param res: Card-related dictionary from the API response.
        """
        self._card_version = res["version"]
        self._card_schema = res["schemaId"]

        try:
            self._card = res["metadata"]
        except KeyError:
            self._card = None

        logger.info("Card attributes for ID %s successfully unpacked.", self.id)

    def __repr__(self) -> str:
        """Return a developer-oriented string representation of the entry.

        :return: String representation with class and ID
        """
        return f"{self.__class__.__name__}({str(self)})"

    def __str__(self) -> str:
        """Return the human-readable string representation of the entry.

        :return: String representation of the entry.
        """
        return f"{self.id}"
