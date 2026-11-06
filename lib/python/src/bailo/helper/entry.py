from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from semantic_version import Version

from bailo.core.entry import Entry
from bailo.core.exceptions import BailoException
from bailo.helper.release import Release

if TYPE_CHECKING:
    from bailo.core.client import Client

__all__ = ["Entry", "ReleaseMixin"]

logger = logging.getLogger(__name__)


class ReleaseMixin:
    """Release and image behaviour shared by the entry kinds that support releases.

    Mixed into :class:`~bailo.core.entry.Entry` subclasses, which provide ``client`` and ``id``.
    """

    if TYPE_CHECKING:
        # Declared for type checkers only; the Entry subclass this is mixed into sets them.
        client: Client
        id: str

    def get_releases(self) -> list[Release]:
        """Get all releases for the entry.

        :return: List of Release objects
        """
        res = self.client.get_all_releases(model_id=self.id)
        # The list response carries the same fields as the single-release one, so no refetch needed.
        releases = [Release._from_json(self.client, self.id, release) for release in res["releases"]]

        logger.info("Successfully retrieved all releases for %s.", self.id)

        return releases

    def get_release(self, version: Version | str) -> Release:
        """Call the Release.from_version method to return an existing release from Bailo.

        :param version: A semantic version for the release
        :return: Release object
        """
        return Release.from_version(self.client, self.id, version)

    def get_latest_release(self) -> Release:
        """Get the latest release for the entry from Bailo.

        :return: Release object
        """
        releases = self.get_releases()
        if not releases:
            raise BailoException(f"{self.__class__.__name__} {self.id} has no releases.")

        latest_release = max(releases)
        logger.info(
            "latest_release (%s) for %s retrieved successfully.",
            str(latest_release.version),
            self.id,
        )

        return latest_release

    def get_images(self) -> list[str]:
        """Get all model image references for the entry.

        :return: List of images
        """
        res = self.client.get_all_images(model_id=self.id)

        logger.info("Images for %s retrieved successfully.", self.id)

        return res["images"]

    def get_image(self):
        """Get a model image reference.

        :raises NotImplementedError: Not implemented error.
        """
        raise NotImplementedError
