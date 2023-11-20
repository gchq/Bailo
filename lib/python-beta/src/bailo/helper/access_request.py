from __future__ import annotations

from typing import Any

from bailo.core.client import Client
from bailo.core.utils import filter_none


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
        end_date: str = None
    ) -> None:

        self.client = client
        self.name = name
        self.model_id = model_id
        self.deleted = deleted
        self.schema_id = schema_id
        self.created_by = created_by
        self.end_date = end_date

    @classmethod
    def from_id(
        cls,
        client: Client,
        model_id: str,
        access_request_id: str
    ) -> AccessRequest:
        """ Returns an existing review from Bailo given it's unique ID

        >>> from bailo import AccessRequest, Client
        >>> client = Client("https://example.com")

        >>> ar = AccessRequest.from_id(client, "test-abcdef", "minimal-general-v10-beta")

        :param client: A client object used to interact with Bailo
        :param model_id: A unique model ID within Bailo
        :param access_request_id: A unique ID for an access request
        """

        json_access_request = client.get_access_request(model_id, access_request_id)['accessRequest']
        name = json_access_request.get('metadata').get('overview').get('name')
        end_date = json_access_request.get('metadata').get('overview').get('entities')[0]
        deleted = json_access_request.get('deleted')
        created_by = json_access_request.get('created_by')

        schema_id = json_access_request.get('schemaId')

        return cls(client, access_request_id, model_id, schema_id, created_by, name, deleted, end_date)

    @classmethod
    def create(cls, client: Client, model_id: str, schema_id: str, name: str, created_by: str, end_date: str) -> Any:
        """ Makes an access request for the model

        Posts an access request to Bailo to be reviewed

        :param client: A client object used to interact with Bailo
        :param model_id: A unique model ID within Bailo
        :param schema_id: A unique schema ID
        :param name: The name of the access request
        :param created_by: The name of the user that created the access request
        :param end_date: The date of the end
        :return: JSON response object
        """

        # Parses the endDate, name and creator into a single object
        metadata = filter_none({
            "overview":{
            "endDate": end_date,
            "entities":[created_by],
            "name":name
        }})

        access_request_json = client.post_access_request(model_id, metadata, schema_id)['accessRequest']

        deleted = access_request_json.get('deleted')

        return cls(client, name, model_id, created_by, deleted,)

    def __str__(self) -> str:
        """ Pretty print of the json file
        """
        return f"Access Request: {self.name} - {self.model_id}"

    def __repr__(self):
        return f"{self.__class__.__name__}({self.access})"
