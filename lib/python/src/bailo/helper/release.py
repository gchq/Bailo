from __future__ import annotations

from io import BytesIO
from typing import Any

from bailo.core.client import Client
from semantic_version import Version


class Release:
    def __init__(
        self,
        client: Client,
        model_id: str,
        version: Version | str,
        model_card_version: int | None = None,
        notes: str = "",
        files: list[str] | None = None,
        images: list[str] | None = None,
        minor: bool = False,
        draft: bool = True,
    ) -> None:
        """Represent a release within Bailo.

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
        self.client = client
        self.model_id = model_id

        if files is None:
            files = []

        if images is None:
            images = []

        if isinstance(version, str):
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
        notes: str,
        model_card_version: int | None = None,
        files: list[str] | None = None,
        images: list[str] | None = None,
        minor: bool = False,
        draft: bool = True,
    ) -> Release:
        """Build a release from Bailo and uploads it.

        :param client: A client object used to interact with Bailo
        :param model_id: A Unique Model ID
        :param version: A semantic version of a model release
        """
        if files is None:
            files = []

        if images is None:
            images = []

        client.post_release(
            model_id,
            str(version),
            notes,
            files,
            images,
            model_card_version,
            minor,
            draft,
        )

        return cls(
            client,
            model_id,
            version,
            model_card_version,
            notes,
            files,
            images,
            minor,
            draft,
        )

    @classmethod
    def from_version(cls, client: Client, model_id: str, version: Version | str) -> Release:
        """Return an existing release from Bailo.

        :param client: A client object used to interact with Bailo
        :param model_id: A Unique Model ID
        :param version: A semantic version of a model release
        """
        res = client.get_release(model_id, str(version))["release"]

        model_card_version = res["modelCardVersion"]
        notes = res["notes"]
        files = res["fileIds"]
        images = res["images"]
        minor = res["minor"]
        draft = res["draft"]

        return cls(
            client,
            model_id,
            version,
            model_card_version,
            notes,
            files,
            images,
            minor,
            draft,
        )

    def download(self, filename: str) -> Any:
        """Give returns a Reading object given the file id.

        :param filename: The name of the file to retrieve
        :return: A JSON response object
        """
        return self.client.get_download_by_filename(self.model_id, str(self.version), filename)

    def upload(self, name: str, file: BytesIO) -> str:
        """Upload files in a given directory to the release.

        :param name: The name of the file to upload to bailo
        :param f: A BytesIO object

        :return: The unique file ID of the file uploaded
        """
        res = self.client.simple_upload(self.model_id, name, file).json()
        self.files.append(res["file"]["id"])
        self.update()
        return res["file"]["id"]

    def update(self) -> Any:
        """Update the any changes to this release on Bailo.

        :return: JSON Response object
        """
        return self.client.put_release(
            self.model_id,
            str(self.version),
            self.notes,
            self.draft,
            self.files,
            self.images,
        )

    def delete(self) -> Any:
        """Delete a release from Bailo.

        :return: JSON Response object
        """
        self.client.delete_release(self.model_id, str(self.version))
        return True

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
