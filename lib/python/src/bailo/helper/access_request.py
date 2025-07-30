from __future__ import annotations

import logging
from typing import Any

from bailo.core.client import Client
from bailo.core.enums import MinimalSchema

logger = logging.getLogger(__name__)


class AccessRequest:
    """Represent an access request within Bailo.

    :param client: Bailo Client instance used for requests.
    :param model_id: Unique model ID.
    :param schema_id: ID of the schema used for the request.
    :param metadata: Access request metadata.
    :param access_request_id: Unique ID for this access request.
    :param created_by: Username or ID of the request creator.
    :param deleted: Whether the access request has been deleted, defaults to False.
    """

    def __init__(
        self,
        client: Client,
        model_id: str,
        schema_id: str,
        metadata: Any,
        access_request_id: str,
        created_by: str,
        deleted: bool = False,
    ) -> None:
        self.client = client
        self.model_id = model_id
        self.schema_id = schema_id
        self.metadata = metadata
        self.access_request_id = access_request_id
        self.created_by = created_by
        self.deleted = deleted

    @classmethod
    def from_id(cls, client: Client, model_id: str, access_request_id: str) -> AccessRequest:
        """Return an existing review from Bailo given it's unique ID.

        :param client: A client object used to interact with Bailo
        :param model_id: A unique model ID within Bailo
        :param access_request_id: A unique ID for an access request
        """
        json_access_request = client.get_access_request(model_id, access_request_id)["accessRequest"]

        deleted = json_access_request["deleted"]
        created_by = json_access_request["createdBy"]
        metadata = json_access_request["metadata"]

        schema_id = json_access_request["schemaId"]

        logger.info(
            "Access request %s for model %s successfully retrieved from server.",
            access_request_id,
            model_id,
        )

        return cls(
            client,
            model_id,
            schema_id,
            metadata,
            access_request_id,
            created_by,
            deleted,
        )

    @classmethod
    def create(
        cls,
        client: Client,
        model_id: str,
        metadata: Any,
        schema_id: str = MinimalSchema.ACCESS_REQUEST,
    ) -> AccessRequest:
        """Make an access request for the model.

        Posts an access request to Bailo to be reviewed

        :param client: A client object used to interact with Bailo
        :param name: The name of the access request
        :param model_id: A unique model ID within Bailo
        :param schema_id: A unique schema ID, defaults to minimal-access-request-general-v10
        :return: JSON response object
        """
        access_request_json = client.post_access_request(model_id, metadata, schema_id)["accessRequest"]

        deleted = access_request_json["deleted"]
        access_request_id = access_request_json["id"]
        metadata = access_request_json["metadata"]
        created_by = access_request_json["createdBy"]

        logger.info(
            "Access request successfully created on server with ID %s for model %s.",
            access_request_id,
            model_id,
        )

        return cls(
            client,
            model_id,
            schema_id,
            metadata,
            access_request_id,
            created_by,
            deleted,
        )

    def delete(self) -> bool:
        """Delete the access request on Bailo.

        :return: A message confirming the removal of the access request.
        """
        self.client.delete_access_request(self.model_id, self.access_request_id)

        logger.info("Access request %s successfully deleted on server.", self.access_request_id)

        return True

    def update(self):
        """Update the access requests's metadata on Bailo."""
        self.client.patch_access_request(self.model_id, self.access_request_id, metadata=self.metadata)

        logger.info("Access request %s successfully updated on server.", self.access_request_id)

    def __str__(self) -> str:
        """Return the human-readable string representation of the access request.

        :return: String value of the enum.
        """
        return f"Access Request: {self.metadata['overview']['name']} - {self.model_id}"

    def __repr__(self):
        """Return a developer-oriented string representation of the access request.

        :return: String representation with class and IDs.
        """
        return f"{self.__class__.__name__}({self.model_id},{self.schema_id})"

    def __eq__(self, other):
        """Check if this access request is equal to another.

        :param other: Object to compare with.
        :return: True if both represent the same request, False otherwise.
        """
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.access_request_id == other.access_request_id
