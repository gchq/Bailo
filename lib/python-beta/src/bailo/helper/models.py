from __future__ import annotations

import datetime
from typing import Any

import dateutil.parser
from bailo.core import Client
from semantic_version import Version


class Release:
    """ Represents a release within Bailo

    :param client: A client object used to interact with Bailo
    :param model_id: A unique model ID
    :param version: A semantic version for the release
    :param model_card_version: Version of the model card
    :param notes: Notes on release
    :param files: A list of files for release
    :param images: A list of images for release
    :param created_at: DateTime the release was created at
    :param created_at: DateTime of when the release was last updated
    :param minor: Is a minor release?
    :param draft: Is a draft release?

    ..note:: Currently files and images are stored as string references
    """

    def __init__(
        self,
        client: Client,
        model_id: str,
        version: Version | str,
        model_card_version: float,
        notes: str,
        files: list[str],
        images: list[str],
        created_at: datetime.time = None,
        updated_at: datetime.time = None,
        minor: bool = False,
        draft: bool = False,
    ) -> None:

        self.client = client
        self.model_id = model_id

        if type(version) == str:
            version = Version(version)
        self.version = version

        self.model_card_version = model_card_version
        self.minor = minor
        self.notes = notes
        self.files = files
        self.images = images
        self.draft = draft
        self.files = files

        self.created_at = created_at
        self.updated_at = updated_at


    @classmethod
    def get_release(
        cls,
        client: Client,
        model_id: str,
        version: Version | str
    ) -> Release:
        """ Returns an existing release from Bailo

        :param client: A client object used to interact with Bailo
        :param model_id: A Unique Model ID
        :param version: A semantic version of a model release
        """

        release_json = client.get_release(model_id, str(version))['release']

        model_card_version = release_json['modelCardVersion']
        minor = release_json['minor']
        notes = release_json['notes']
        files = release_json['fileIds']
        images = release_json['images']
        draft = release_json['draft']

        created_at = dateutil.parser.parser(release_json['createdAt'])
        updated_at = dateutil.parser.parser(release_json['updatedAt'])
        return cls(client, model_id, version, model_card_version, notes, files, images, created_at, updated_at, minor, draft)

    def publish(self) -> None:
        """ Publishes a release to Bailo
        """
        return self.client.post_release(
            self.model_id,
            self.model_card_version,
            str(self.version),
            self.notes,
            self.files,
            self.images,
            self.minor,
            self.draft
        )

    def delete(self) -> Any:
        """ Deletes a release from Bailo

        :return: JSON Response object
        """
        return self.client.delete_release(self.model_id, str(self.version))


    def __str__(self) -> str:
        return f"{self.model_id} v {self.version}"
