from __future__ import annotations

import logging
import os
import shutil
import tempfile
import warnings
from typing import Any

from semantic_version import Version

# isort: split

from bailo.core.client import Client
from bailo.core.enums import CollaboratorEntry, EntryKind, MinimalSchema, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.core.utils import NestedDict
from bailo.helper.entry import Entry
from bailo.helper.release import Release

logger = logging.getLogger(__name__)


class MirroredModel(Entry):
    """Represent a mirrored model within Bailo.

    :param client: A client object used to interact with Bailo
    :param model_id: A unique ID for the mirrored model
    :param name: Name of mirrored model
    :param description: Description of mirrored model
    :param organisation: Organisation responsible for the mirrored model, defaults to None
    :param state: Development readiness of the model, defaults to None
    :param collaborators: list of CollaboratorEntry to define who the mirrored model's collaborators (a.k.a. mirrored model access) are, defaults to None
    :param visibility: Visibility of model, using ModelVisibility enum (e.g Public or Private), defaults to None
    """

    def __init__(
        self,
        client: Client,
        model_id: str,
        name: str,
        description: str,
        organisation: str | None = None,
        state: str | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
        visibility: ModelVisibility | None = None,
    ) -> None:
        super().__init__(
            client=client,
            id=model_id,
            name=name,
            description=description,
            kind=EntryKind.MIRRORED_MODEL,
            visibility=visibility,
            organisation=organisation,
            state=state,
            collaborators=collaborators,
        )

        self.model_id = model_id

    @classmethod
    def create(
        cls,
        client: Client,
        name: str,
        description: str,
        organisation: str | None = None,
        state: str | None = None,
        collaborators: list[CollaboratorEntry] | None = None,
        visibility: ModelVisibility | None = None,
    ) -> Model:
        """Build a mirrored model from Bailo and upload it.

        :param client: A client object used to interact with Bailo
        :param name: Name of model
        :param description: Description of model
        :param organisation: Organisation responsible for the model, defaults to None
        :param state: Development readiness of the model, defaults to None
        :param collaborators: list of CollaboratorEntry to define who the model's collaborators (a.k.a. model access) are, defaults to None
        :param visibility: Visibility of model, using ModelVisibility enum (e.g Public or Private), defaults to None
        :return: Model object
        """
        res = client.post_model(
            name=name,
            kind=EntryKind.MIRRORED_MODEL,
            description=description,
            visibility=visibility,
            organisation=organisation,
            state=state,
            collaborators=collaborators,
        )
        model_id = res["model"]["id"]
        logger.info("Model successfully created on server with ID %s.", model_id)

        model = cls(
            client=client,
            model_id=model_id,
            name=name,
            description=description,
            visibility=visibility,
            organisation=organisation,
            state=state,
            collaborators=collaborators,
        )

        model._unpack(res["model"])

        return model

    @classmethod
    def from_id(cls, client: Client, model_id: str) -> Model:
        """Return an existing model from Bailo.

        :param client: A client object used to interact with Bailo
        :param model_id: A unique model ID
        :return: A model object
        """
        res = client.get_model(model_id=model_id)["model"]
        if res["kind"] != "model":
            raise BailoException(f"ID {model_id} does not belong to a model. Did you mean to use Datacard.from_id()?")

        logger.info("Model %s successfully retrieved from server.", model_id)

        model = cls(
            client=client,
            model_id=model_id,
            name=res["name"],
            description=res["description"],
            collaborators=res["collaborators"],
            organisation=res.get("organisation"),
            state=res.get("state"),
        )

        model._unpack(res)
        model.get_card_latest()

        return model

    @classmethod
    def search(
        cls,
        client: Client,
        task: str | None = None,
        libraries: list[str] | None = None,
        filters: list[str] | None = None,
        search: str = "",
    ) -> list[Model]:
        """Return a list of mirrored model objects from Bailo, based on search parameters.

        :param client: A client object used to interact with Bailo
        :param task: Mirrored model task (e.g. image classification), defaults to None
        :param libraries: Mirrored m library (e.g. TensorFlow), defaults to None
        :param filters: Custom filters, defaults to None
        :param search: String to be located in model cards, defaults to ""
        :return: List of Mirrored model objects
        """
        res = client.get_models(task=task, libraries=libraries, filters=filters, search=search)
        models = []

        for model in res["models"]:
            res_model = client.get_model(model_id=model["id"])["model"]
            model_obj = cls(
                client=client,
                model_id=model["id"],
                name=model["name"],
                description=model["description"],
                collaborators=model["collaborators"],
                organisation=model.get("organisation"),
                state=model.get("state"),
            )
            model_obj._unpack(res_model)
            model_obj.get_card_latest()
            models.append(model_obj)

        return models

    def get_releases(self) -> list[Release]:
        """Get all releases for the mirrored model.

        :return: List of Release objects
        """
        res = self.client.get_all_releases(model_id=self.model_id)
        releases = []

        for release in res["releases"]:
            releases.append(self.get_release(version=release["semver"]))

        logger.info("Successfully retrieved all releases for model %s.", self.model_id)

        return releases

    def get_release(self, version: Version | str) -> Release:
        """Call the Release.from_version method to return an existing release from Bailo.

        :param version: A semantic version for the release
        :return: Release object
        """
        return Release.from_version(self.client, self.model_id, version)

    def get_latest_release(self):
        """Get the latest release for the model from Bailo.

        :return: Release object
        """
        releases = self.get_releases()
        if not releases:
            raise BailoException("This model has no releases.")

        latest_release = max(releases)
        logger.info(
            "latest_release (%s) for %s retrieved successfully.",
            str(latest_release.version),
            self.model_id,
        )

        return max(releases)

    def get_images(self):
        """Get all model image references for the model.

        :return: List of images
        """
        res = self.client.get_all_images(model_id=self.model_id)

        logger.info("Images for %s retrieved successfully.", self.model_id)

        return res["images"]

    def get_image(self):
        """Get a model image reference.

        :raises NotImplementedError: Not implemented error.
        """
        raise NotImplementedError

    @property
    def model_card(self):
        """Get the data of the model card.

        :return: Model card data.
        """
        return self._card

    @property
    def model_card_version(self):
        """Get the version of the model card.

        :return: Model card version.
        """
        return self._card_version

    @property
    def model_card_schema(self):
        """Get the schema of the model card.

        :return: Model card schema.
        """
        return self._card_schema

    def __repr__(self) -> str:
        """Return a developer-oriented string representation of the model.

        :return: String representation with class and ID
        """
        return f"{self.__class__.__name__}({str(self)})"

    def __str__(self) -> str:
        """Return the human-readable string representation of the model.

        :return: String value of the enum.
        """
        return f"{self.model_id}"
