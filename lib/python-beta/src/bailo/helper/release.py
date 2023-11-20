from __future__ import annotations

from tempfile import _TemporaryFileWrapper
from typing import Any

from bailo.core.client import Client
from semantic_version import Version


class Release:
    """ Represents a release within Bailo

    :param client: A client object used to interact with Bailo
    :param model_id: A unique model ID
    :param version: A semantic version for the release
    :param model_card_version: Version of the model card
    :param notes: Notes on release
    :param files: (optional) A list of files for release
    :param images: (optional) A list of images for release
    :param minor: Is a minor release?
    :param draft: Is a draft release?

    ..note:: Currently files and images are stored as string references
    """
    def __init__(
        self,
        client: Client,
        model_id: str,
        version: Version | str,
        model_card_version: float = 1,
        notes: str = "",
        files: list[str] = [],
        images: list[str] = [],
        minor: bool = False,
        draft: bool = True,
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

    @classmethod
    def create(
        cls,
        client: Client,
        model_id: str,
        version: Version | str,
        model_card_version: float,
        notes: str = "",
        files: list[str] = [],
        images: list[str] = [],
        minor: bool = False,
        draft: bool = True,
    ) -> Release:
        """ Builds a release from Bailo and uploads it

        :param client: A client object used to interact with Bailo
        :param model_id: A Unique Model ID
        :param version: A semantic version of a model release
        """
        if type(version) == Version:
            version = Version(version)

        client.post_release(model_id, version, notes, files, images, minor, draft)

        return cls(
            client,
            model_id,
            version,
            model_card_version,
            notes,
            files,
            images,
            minor,
            draft
        )


    @classmethod
    def from_version(
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

        res = client.get_release(model_id, str(version)).get('release')

        model_card_version = res.get('modelCardVersion')
        notes = res.get('notes')
        files = res.get('fileIds')
        images = res.get('images')
        minor = res.get('minor')
        draft = res.get('draft')

        return cls(
            client,
            model_id,
            version,
            model_card_version,
            notes,
            files,
            images,
            minor,
            draft
        )

    def get_file(self, file_id:str, localfile_name:str = None) -> _TemporaryFileWrapper[bytes] | str:
        """ Gives the user a tempfile from file id requested.

        Files have to be explicitly closed at runtime once processed via `.close()`

        Examples
        >>> release = Release.from_id(client, "test-abcdef")

        >>> tp = release.get_file('<file-id>') # Save to temp
        >>> tp.seek(0)
        >>> tp.readlines()

        >>> tp = release.get_file('<file-id>', '<localfile-name>') # Save to local
        >>> tp.readlines()

        :param file_name: The name of the file to retrieve
        :return: Tempfile containing a binary of the file
        """

        return self.client.get_download_file(self.model_id, file_id, localfile_name)

    def upload_file(self, file_id:str):
        """ Uploads a file to bailo and adds it to the given release

        :param file_id: the name of the file to upload to bailo from local directory
        """
        res = self.client.simple_upload(self.model_id, file_id)
        self.files.append(res['file']['id'])
        self.update()
        return res

    def update(self) -> Any:
        """ Updates the any changes to this release on Bailo

        :return: JSON Response object
        """
        return self.client.put_release(self.model_id, str(self.version), self.notes, self.draft, self.files, self.images)

    def delete(self) -> Any:
        """ Deletes a release from Bailo

        :return: JSON Response object
        """
        return self.client.delete_release(self.model_id, str(self.version))

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({str(self)})"

    def __str__(self) -> str:
        return f"{self.model_id} v{self.version}"

    def __eq__(self, other) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.version == other.version

    def __ne__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self != other

    def __lt__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.version < other.version

    def __le__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.version <= other.version

    def __gt__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.version > other.version

    def __ge__(self, other):
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.version >= other.version

    def __hash__(self) -> int:
        return hash((self.model_id, self.version))
