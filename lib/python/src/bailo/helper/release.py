from __future__ import annotations

import os
import fnmatch
import shutil
from io import BytesIO
from typing import Any, Union
from tqdm import tqdm
from tqdm.utils import CallbackIOWrapper

from bailo.core.client import Client
from bailo.core.exceptions import BailoException
from bailo.core.utils import NO_COLOR
from semantic_version import Version

BLOCK_SIZE = 1024


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

    def download(self, filename: str, write: bool = True, path: str | None = None) -> Any:
        """Returns a response object given the file name and optionally writes file to disk.

        :param filename: The name of the file to retrieve
        :param write: Bool to determine if writing file to disk, defaults to True
        :param path: Local path to write file to (if write set to True)

        :return: A JSON response object
        """
        res = self.client.get_download_by_filename(self.model_id, str(self.version), filename)

        if write:
            if path is None:
                path = filename
            total_size = int(res.headers.get("content-length", 0))

            if NO_COLOR:
                colour = "white"
            else:
                colour = "green"

            with tqdm(
                total=total_size,
                unit="B",
                unit_scale=True,
                unit_divisor=BLOCK_SIZE,
                postfix=f"downloading {filename} as {path}",
                colour=colour,
            ) as t:
                with open(path, "wb") as f:
                    for data in res.iter_content(BLOCK_SIZE):
                        t.update(len(data))
                        f.write(data)

        return res

    def download_all(self, path: str = os.getcwd(), include: list | str = None, exclude: list | str = None):
        """Writes all files to disk given a local directory.

        :param include: List or string of fnmatch statements for file names to include, defaults to None
        :param exclude: List or string of fnmatch statements for file names to exclude, defaults to None
        :param path: Local directory to write files to
        :raises BailoException: If the release has no files assigned to it
        ..note:: Fnmatch statements support Unix shell-style wildcards.
        """
        files_metadata = self.client.get_release(self.model_id, str(self.version))["release"]["files"]
        if files_metadata == []:
            raise BailoException("Release has no associated files.")
        file_names = [file_metadata["name"] for file_metadata in files_metadata]

        if isinstance(include, str):
            include = [include]
        if isinstance(exclude, str):
            exclude = [exclude]

        if include is not None:
            file_names = [file for file in file_names if any([fnmatch.fnmatch(file, pattern) for pattern in include])]

        if exclude is not None:
            file_names = [
                file for file in file_names if not any([fnmatch.fnmatch(file, pattern) for pattern in exclude])
            ]

        os.makedirs(path, exist_ok=True)
        for file in file_names:
            file_path = os.path.join(path, file)
            self.download(filename=file, path=file_path)

    def upload(self, path: str, data: BytesIO | None = None) -> str:
        """Upload a file to the release.

        :param path: The path, or name of file or directory to be uploaded
        :param data: A BytesIO object if not loading from disk

        :return: The unique file ID of the file uploaded
        ..note:: If path provided is a directory, it will be uploaded as a zip
        """
        name = os.path.split(path)[-1]

        if data is None:
            if is_zip := os.path.isdir(path):
                shutil.make_archive(name, "zip", path)
                path = f"{name}.zip"
                name = path

            data = open(path, "rb")

            if is_zip:
                os.remove(path)

        old_file_position = data.tell()
        data.seek(0, os.SEEK_END)
        size = data.tell()
        data.seek(old_file_position, os.SEEK_SET)

        if NO_COLOR:
            colour = "white"
        else:
            colour = "blue"

        with tqdm(
            total=size, unit="B", unit_scale=True, unit_divisor=BLOCK_SIZE, postfix=f"uploading {name}", colour=colour
        ) as t:
            wrapped_buffer = CallbackIOWrapper(t.update, data, "read")
            res = self.client.simple_upload(self.model_id, name, wrapped_buffer).json()

        self.files.append(res["file"]["id"])
        self.update()
        if not isinstance(data, BytesIO):
            data.close()
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
