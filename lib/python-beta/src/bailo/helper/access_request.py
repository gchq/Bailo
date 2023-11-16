from __future__ import annotations

import datetime
from typing import Any

import dateutil.parser
from bailo.core.client import Client
from bailo.core.enums import ReviewDecision, Role
from bailo.helper.reviews import Review
from bailo.helper.schema import Schema


class AccessRequest:
    """ Represents a review within Bailo

    A review can either be access to a model or to a specific release

    :param client: A client object that is used to make requests to bailo
    :param name: The name of the access request
    :param model_id: The unique model id of the model that the access request is being made with
    :param schema_id: An ID for the schema within Bailo
    :param deleted: Whether the access request has been deleted
    """

    def __init__(
        self,
        client: Client,
        name: str,
        model_id: str,
        created_by:str,
        schema_id: str,
        deleted: bool = False,
        created_at: datetime.time = None,
        updated_at: datetime.time = None,
    ) -> None:

        self.client = client
        self.name = name
        self.model_id = model_id
        self.deleted = deleted
        self.schema_id = schema_id
        self.created_by = created_by
        self.created_at = created_at
        self.updated_at = updated_at

    @classmethod
    def retrieve(
        cls,
        client: Client,
        model_id: str,
        access_request_id: str
    ) -> AccessRequest:
        """ Returns an existing review from Bailo

        :param client: A client object used to interact with Bailo
        :param model_id: A unique model ID within Bailo
        :param access_request_id: A unique ID for an access request
        """

        json_access_request = client.get_access_request(model_id, access_request_id)['accessRequest']
        name = json_access_request['metadata']['overview']['name']
        deleted = json_access_request['deleted']
        created_by = json_access_request['created_by']

        schema_id = json_access_request['schemaId']
        created_at = dateutil.parser.parser(json_access_request['createdAt'])
        updated_at = dateutil.parser.parser(json_access_request['updatedAt'])

        return cls(client, access_request_id, model_id, schema_id, created_by, name, deleted, created_at, updated_at)

    def create(self) -> Any:
        """ Makes an access request for the model

        Posts an access request to Bailo to be reviewed

        :return: JSON response object
        """

        # Contains the name of the access request and the entities
        metadata = {
            "overview":{
            "entities":[self.created_by],
            "name":self.name
        }}

        access_request_json = self.client.post_access_request(self.model_id, metadata, self.schema_id)['accessRequest']

        self.deleted = access_request_json['deleted']
        self.created_at = dateutil.parser.parser(access_request_json['createdAt'])
        self.updated_at = dateutil.parser.parser(access_request_json['updatedAt'])

        return access_request_json

    def review(self, role: Role | str, decision: ReviewDecision | str, comment: str) -> Review:
        """ Sends a response for the access request

        :param role: The role of the reviewer
        :param decision: Either an approve or a request changes
        :param comment: A comment to go with the review
        :return: JSON response object of the review
        """

        return Review.make_review(
            client=self.client,
            model_id=self.model_id,
            kind=self.schema_id,
            role=role
        )

    def __str__(self) -> str:
        """ Pretty print of the json file
        """
        return f"Access Request: {self.name} - {self.model_id}"
