from __future__ import annotations

from enum import Enum


class ValuedEnum(str, Enum):
    def __str__(self) -> str:
        """Return the string representation of this enum's value.

        :return: String value of the enum.
        """
        return str(self.value)


class ModelVisibility(ValuedEnum):
    """Whether a model is publicly visible or not."""

    PRIVATE = "private"
    PUBLIC = "public"


class SchemaKind(ValuedEnum):
    """A type of schema."""

    MODEL = "model"
    ACCESS_REQUEST = "accessRequest"


class Role(ValuedEnum):
    """A reviewing role."""

    OWNER = "owner"
    CONTRIBUTOR = "contributor"
    CONSUMER = "consumer"


class EntryKind(ValuedEnum):
    """The type of model."""

    MODEL = "model"
    DATACARD = "data-card"


class MinimalSchema(ValuedEnum):
    """A minimal schema."""

    MODEL = "minimal-general-v10"
    DATACARD = "minimal-data-card-v10"
    ACCESS_REQUEST = "minimal-access-request-general-v10"


class CollaboratorEntry(dict):
    """A set of roles linked to a given entity (a.k.a. user)."""

    def __init__(self, entity: str, roles: list[Role | str]) -> None:
        """Initialise a CollaboratorEntry.

        :param entity: The entity (e.g. user) identifier.
        :param roles: List of roles assigned to the entity.
        """
        super().__init__(self, entity=entity, roles=roles)
