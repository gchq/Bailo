from __future__ import annotations

import shutil
from io import BytesIO
from typing import Any

from bailo.core.agent import Agent, TokenAgent
from bailo.core.enums import ModelVisibility, SchemaKind
from bailo.core.utils import filter_none


class Client:
    """Create a Client object that can be used to talk to the website.

    :param url: Url of bailo website
    :param agent: An agent object to handle requests
    """

    def __init__(self, url: str, agent: Agent = Agent()):
        self.url = url.rstrip("/") + "/api"
        self.agent = agent

    def post_model(
        self,
        name: str,
        description: str,
        team_id: str,
        visibility: ModelVisibility | None = None,
    ):
        """Create a model.

        :param name: Name of the model
        :param description: Description of the model
        :param visibility: Enum to define model visibility (e.g public or private)
        :return: JSON response object
        """
        if visibility is not None:
            visibility = str(visibility)

        filtered_json = filter_none(
            {
                "name": name,
                "description": description,
                "visibility": visibility,
                "teamId": team_id,
            }
        )

        return self.agent.post(
            f"{self.url}/v2/models",
            json=filtered_json,
        ).json()

    def get_models(
        self,
        task: str | None = None,
        libraries: list[str] | None = None,
        filters: list[str] | None = None,
        search: str = "",
    ):
        """Find and returns a list of models based on provided search terms.

        :param task: Model task (e.g. image classification), defaults to None
        :param libraries: Model library (e.g. TensorFlow), defaults to []
        :param filters: Custom filters, defaults to []
        :param search: String to be located in model cards, defaults to ""
        :return: JSON response object
        """
        if libraries is None:
            libraries = []

        if filters is None:
            filters = []

        return self.agent.get(
            f"{self.url}/v2/models/search",
            params={
                "task": task,
                "libraries": libraries,
                "filters": filters,
                "search": search,
            },
        ).json()

    def get_model(
        self,
        model_id: str,
    ):
        """Retrieve a specific model using its unique ID.

        :param model_id: Unique model ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}",
        ).json()

    def patch_model(
        self,
        model_id: str,
        name: str | None = None,
        description: str | None = None,
        visibility: str | None = None,
    ):
        """Update a specific model using its unique ID.

        :param model_id: Unique model ID
        :param name: Name of the model, defaults to None
        :param description: Description of the model, defaults to None
        :param visibility: Enum to define model visibility (e.g. public or private), defaults to None
        :return: JSON response object
        """
        filtered_json = filter_none({"name": name, "description": description, "visibility": visibility})

        return self.agent.patch(f"{self.url}/v2/model/{model_id}", json=filtered_json).json()

    def get_model_card(
        self,
        model_id: str,
        version: str,
    ):
        """Retrieve a specific model card, using the unique model ID and version.

        :param model_id: Unique model ID
        :param version: Model card version
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/model-card/{version}",
        ).json()

    def put_model_card(
        self,
        model_id: str,
        metadata: Any,
    ):
        """Update the latest model card, using the unique model ID.

        :param model_id: Unique model ID
        :param metadata: Metadata object, defined by model card schema
        :return: JSON response object
        """
        return self.agent.put(
            f"{self.url}/v2/model/{model_id}/model-cards",
            json={
                "metadata": metadata,
            },
        ).json()

    def model_card_from_schema(
        self,
        model_id: str,
        schema_id: str,
    ):
        """
        Create a model card using a given schema ID.

        :param model_id: Unique model ID
        :param schema_id: Unique model card schema ID
        :return: JSON response object
        """
        return self.agent.post(
            f"{self.url}/v2/model/{model_id}/setup/from-schema",
            json={
                "schemaId": schema_id,
            },
        ).json()

    def post_release(
        self,
        model_id: str,
        release_version: str,
        notes: str,
        file_ids: list[str],
        images: list[str],
        model_card_version: int | None = None,
        minor: bool | None = False,
        draft: bool | None = False,
    ):
        """
        Create a new model release.

        :param model_id: Unique model ID
        :param model_card_version: Model card version
        :param release_version: Release version
        :param notes: Notes on release
        :param file_ids: Files for release
        :param images: Images for release
        :param minor: Signifies a minor release, defaults to False
        :param draft: Signifies a draft release, defaults to False
        :return: JSON response object
        """
        filtered_json = filter_none(
            {
                "modelCardVersion": model_card_version,
                "semver": release_version,
                "notes": notes,
                "minor": minor,
                "draft": draft,
                "fileIds": file_ids,
                "images": images,
            }
        )
        return self.agent.post(f"{self.url}/v2/model/{model_id}/releases", json=filtered_json).json()

    def put_release(
        self,
        model_id: str,
        release_version: str,
        notes: str,
        draft: bool,
        file_ids: list[str],
        images: list[str],
    ):
        """
        Create a new model release.

        :param model_id: Unique model ID
        :param model_card_version: Model card version
        :param release_version: Release version
        :param notes: Notes on release
        :param file_ids: Files for release
        :param images: Images for release
        :param minor: Signifies a minor release, defaults to False
        :param draft: Signifies a draft release, defaults to False
        :return: JSON response object
        """
        return self.agent.put(
            f"{self.url}/v2/model/{model_id}/release/{release_version}",
            json={
                "notes": notes,
                "draft": draft,
                "fileIds": file_ids,
                "images": images,
            },
        ).json()

    def get_all_releases(
        self,
        model_id: str,
    ):
        """
        Get all releases for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/releases",
        ).json()

    def get_release(self, model_id: str, release_version: str):
        """
        Get a specific model release.

        :param model_id: Unique model ID
        :param release_version: Release version
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/release/{release_version}",
        ).json()

    def delete_release(
        self,
        model_id: str,
        release_version: str,
    ):
        """
        Delete a specific model release.

        :param model_id: Unique model ID
        :param release_version: Release version
        :return: JSON response object
        """
        return self.agent.delete(
            f"{self.url}/v2/model/{model_id}/release/{release_version}",
        ).json()

    def get_files(
        self,
        model_id: str,
    ):
        """
        Get files for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/files",
        ).json()

    def get_download_file(
        self,
        model_id: str,
        file_id: str,
    ):
        """Download a specific file by it's id.

        :param model_id: Unique model ID
        :param file_id: Unique file ID
        :return: The unique file ID
        """
        if isinstance(self.agent, TokenAgent):
            return self.agent.get(
                f"{self.url}/v2/token/model/{model_id}/file/{file_id}/download", stream=True, timeout=10_000
            )
        else:
            return self.agent.get(
                f"{self.url}/v2/model/{model_id}/file/{file_id}/download", stream=True, timeout=10_000
            )

    def get_download_by_filename(
        self,
        model_id: str,
        semver: str,
        filename: str,
    ):
        """Download a specific file.

        :param model_id: Unique model ID
        :param semver: Semver of the release
        :param filename: The filename trying to download from
        :return: The filename
        """
        if isinstance(self.agent, TokenAgent):
            return self.agent.get(
                f"{self.url}/v2/token/model/{model_id}/release/{semver}/file/{filename}/download",
                stream=True,
                timeout=10_000,
            )
        else:
            return self.agent.get(
                f"{self.url}/v2/model/{model_id}/release/{semver}/file/{filename}/download", stream=True, timeout=10_000
            )

    def simple_upload(self, model_id: str, name: str, buffer: BytesIO):
        """Create a simple file upload.

        :param model_id: Unique model ID
        :param name: File name
        :return: JSON response object
        """
        return self.agent.post(
            f"{self.url}/v2/model/{model_id}/files/upload/simple",
            params={"name": name},
            data=buffer,
            stream=True,
            timeout=10_000,
        )

    # def start_multi_upload(): TBC

    # def finish_multi_upload(): TBC

    def delete_file(
        self,
        model_id: str,
        file_id: str,
    ):
        """Delete a specific file associated with a model.

        :param model_id: Unique model ID
        :param file_id: Unique file ID
        :return: JSON response object
        """
        return self.agent.delete(
            f"{self.url}/v2/model/{model_id}/files/{file_id}",
        ).json()

    def get_all_images(
        self,
        model_id: str,
    ):
        """Get all images.

        :param model_id: A unique model ID
        :return: JSON response object
        """
        return self.agent.get(f"{self.url}/v2/model/{model_id}/images").json()

    def get_all_schemas(
        self,
        kind: SchemaKind | None = None,
    ):
        """Get all schemas.

        :param kind: Enum to define schema kind (e.g. Model or AccessRequest), defaults to None
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/schemas",
            params={"kind": kind},
        ).json()

    def get_schema(
        self,
        schema_id: str,
    ):
        """Retrieve a specific schema using its unique ID.

        :param schema_id: Unique schema ID
        :return: JSON response object.
        """
        return self.agent.get(
            f"{self.url}/v2/schema/{schema_id}",
        ).json()

    def post_schema(
        self,
        schema_id: str,
        name: str,
        description: str,
        kind: SchemaKind,
        json_schema: dict[str, Any],
    ):
        """Create a schema.

        :param schema_id: Unique schema ID
        :param name: Name of the schema
        :param description: Description for the schema
        :param kind: Enum to define schema kind (e.g. Model or AccessRequest)
        :param json_schema: JSON schema
        :return: JSON response object
        """
        return self.agent.post(
            f"{self.url}/v2/schemas",
            json={
                "id": schema_id,
                "name": name,
                "description": description,
                "kind": str(kind),
                "jsonSchema": json_schema,
            },
        ).json()

    def get_reviews(
        self,
        active: bool,
        model_id: str | None = None,
        version: str | None = None,
    ):
        """Get all reviews within given parameters.

        :param active: Boolean representing status of review
        :param model_id: Unique model ID, defaults to None
        :param version: Model version, defaults to None
        :return: JSON response object.
        """
        active = str(active).lower()

        return self.agent.get(
            f"{self.url}/v2/reviews",
            params={
                "active": active,
                "modelId": model_id,
                "semver": version,
            },
        ).json()

    def post_review(
        self,
        model_id: str,
        role: str,
        decision: str,
        version: str | None = None,
        comment: str | None = None,
    ):
        """Create a review for a release.

        :param model_id: A unique model ID
        :param version: A semantic version for a release
        :param role: The role of the user making the review
        :param decision: Either approve or request changes
        :param comment: A comment to go with the review
        """
        filtered_json = filter_none({"role": role, "decision": decision, "comment": comment})
        return self.agent.post(
            f"{self.url}/v2/model/{model_id}/release/{version}/review",
            json=filtered_json,
        ).json()

    def get_model_roles(
        self,
        model_id: str,
    ):
        """
        Get roles for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/roles",
        ).json()

    def get_model_user_roles(
        self,
        model_id: str,
    ):
        """Get current users roles for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/roles/mine",
        ).json()

    def post_team(
        self,
        team_id: str,
        name: str,
        description: str,
    ):
        """
        Create new team.

        :param team_id: Unique team ID
        :param name: Team name
        :param description: Team description
        :return: JSON response object
        """
        return self.agent.post(
            f"{self.url}/v2/teams",
            json={
                "id": team_id,
                "name": name,
                "description": description,
            },
        ).json()

    def get_all_teams(
        self,
    ):
        """
        Get all teams.

        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/teams",
        ).json()

    def get_user_teams(
        self,
    ):
        """
        Get user teams.

        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/teams/mine",
        ).json()

    def get_team(
        self,
        team_id: str,
    ):
        """Retrieve a specific team given its unique ID.

        :param team_id: Unique team ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/team/{team_id}",
        ).json()

    def patch_team(
        self,
        team_id: str,
        name: str | None = None,
        description: str | None = None,
    ):
        """Update a team given its unique ID.

        :param team_id: Unique team ID
        :param name: Name of team, defaults to None
        :param description: Description of team, defaults to None
        :return: JSON response object
        """
        filtered_json = filter_none({"name": name, "description": description})

        return self.agent.patch(
            f"{self.url}/v2/team/{team_id}",
            json=filtered_json,
        ).json()

    def get_access_request(self, model_id: str, access_request_id: str):
        """Retrieve a specific access request given its unique ID.

        :param model_id: Unique model ID
        :param access_request_id: Unique access request ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/access-request/{access_request_id}",
        ).json()

    def get_access_requests(
        self,
        model_id: str,
    ):
        """Retrieve all access requests given a specific model.

        :param model_id: Unique model ID
        :param access_request_id: Unique access request ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/access-requests",
        ).json()

    def post_access_request(self, model_id: str, metadata: Any, schema_id: str):
        """Create an access request given a model ID.

        :param model_id: Unique model ID
        :param metadata: Metadata object, defined by access request schema
        :param schema_id: Unique schema ID
        :return: JSON response object
        """
        return self.agent.post(
            f"{self.url}/v2/model/{model_id}/access-requests",
            json={"schemaId": schema_id, "metadata": metadata},
        ).json()

    def delete_access_request(self, model_id: str, access_request_id: str):
        """Delete a specific access request associated with a model.

        :param model_id: Unique model ID
        :param access_request_id: Unique access request ID
        :return: JSON response object
        """
        return self.agent.delete(
            f"{self.url}/v2/model/{model_id}/access-request/{access_request_id}",
        ).json()

    def patch_access_request(
        self,
        model_id: str,
        access_request_id: str,
        metadata: Any,
        schema_id: str | None = None,
    ):
        """Update an access request given its unique ID.

        :param model_id: Unique model ID
        :param access_request_id: Unique access request ID
        :metadata: Metadata object, defined by access request schemas
        :return: JSON response object
        """
        filtered_json = filter_none({"schemaId": schema_id, "metadata": metadata})
        return self.agent.patch(
            f"{self.url}/v2/model/{model_id}/access-request/{access_request_id}",
            json=filtered_json,
        ).json()
