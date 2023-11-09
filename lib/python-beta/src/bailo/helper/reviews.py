from __future__ import annotations

import datetime
import json
from dataclasses import dataclass
from typing import Any

import dateutil.parser
from bailo.core.client import Client
from bailo.core.enums import ReviewDecision, Role, SchemaKind
from semantic_version import Version


class Review:
    """ Represents a review within Bailo

    A review can either be access to a model or to a specific release

    :param client: A client object that is used to make requests to bailo
    :param model_id: A unique model ID
    :param kind: Either an access request review or a release review
    :param role: The role of the user to review the request
    :param responses: A list of responses
    :param version: A semantic version for the review
    """

    def __init__(
        self,
        client: Client,
        model_id: str,
        kind: SchemaKind | str,
        role: Role | str,
        version: Version | str,
        response: list[ReviewResponse] = [],
        created_at: datetime.time = None,
        updated_at: datetime.time = None
    ) -> None:

        self.client = client
        self.model_id = model_id

        if type(version) == str:
            version = Version(version)
        self.role = Role(role)
        self.kind = SchemaKind(kind)

        self.response = response
        self.created_at = created_at
        self.updated_at = updated_at

    @classmethod
    def make_review(
        cls,
        client: Client,
        model_id: str,
        version: Version | str,
        role: Role | str,
        decision: ReviewDecision | str,
        comment: str = None
    ) -> Any:
        """ Creates a review within Bailo

        :param client: A client object used to interact with Bailo
        :param model_id: A unique model ID
        :param version: The semantic version of the release
        :param role: The role of the review made
        :param decision: Either approve or request changes
        :param comment: A comment to go with the review
        """

        json_schema = client.post_review(model_id, str(version), str(role), str(decision), comment)['review']

        kind = SchemaKind(json_schema['kind'])
        response = ReviewResponse(role, decision, comment)
        created_at = dateutil.parser.parser(json_schema['createdAt'])
        updated_at = dateutil.parser.parser(json_schema['updatedAt'])

        # Create a review with the client
        return cls(client, model_id, kind, role, created_at, updated_at, version, response)

    def __str__(self) -> str:
        """ Pretty print of the json file
        """
        return json.dumps(self.json_schema,indent=4)

@dataclass
class ReviewResponse:
    """ Represents a review response within Bailo

    :param role: The role of the user to review the request
    :param decision: Either the request is approved or changes are requested
    :param comment: A comment left with the review
    """
    role: Role
    decision: ReviewDecision
    comment: str | None = None
