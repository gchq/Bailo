from __future__ import annotations

import os
import shutil
import tempfile
from typing import Any
import logging
import warnings

from bailo.core.client import Client
from bailo.core.enums import EntryKind, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.core.utils import NestedDict
from bailo.helper.entry import Entry
from bailo.helper.release import Release
from semantic_version import Version

try:
    import mlflow

    ml_flow = True
except ImportError:
    ml_flow = False

logger = logging.getLogger(__name__)


class Model(Entry):
    """Represent a model within Bailo.

    :param client: A client object used to interact with Bailo
    :param model_id: A unique ID for the model
    :param name: Name of model
    :param description: Description of model
    :param visibility: Visibility of model, using ModelVisibility enum (e.g Public or Private), defaults to None
    """

    def __init__(
        self,
        client: Client,
        model_id: str,
        name: str,
        description: str,
        visibility: ModelVisibility | None = None,
    ) -> None:
        super().__init__(
            client=client, id=model_id, name=name, description=description, kind=EntryKind.MODEL, visibility=visibility
        )

        self.model_id = model_id

    @classmethod
    def create(
        cls,
        client: Client,
        name: str,
        description: str,
        team_id: str,
        visibility: ModelVisibility | None = None,
    ) -> Model:
        """Build a model from Bailo and upload it.

        :param client: A client object used to interact with Bailo
        :param name: Name of model
        :param description: Description of model
        :param team_id: A unique team ID
        :param visibility: Visibility of model, using ModelVisibility enum (e.g Public or Private), defaults to None
        :return: Model object
        """
        res = client.post_model(
            name=name, kind=EntryKind.MODEL, description=description, team_id=team_id, visibility=visibility
        )
        model_id = res["model"]["id"]
        logger.info(f"Model successfully created on server with ID %s.", model_id)

        model = cls(
            client=client,
            model_id=res["model"]["id"],
            name=name,
            description=description,
            visibility=visibility,
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

        logger.info(f"Model %s successfully retrieved from server.", model_id)

        model = cls(
            client=client,
            model_id=model_id,
            name=res["name"],
            description=res["description"],
        )

        model._unpack(res)
        model.get_card_latest()

        return model

    def update_model_card(self, model_card: dict[str, Any] | None = None) -> None:
        """Upload and retrieve any changes to the model card on Bailo.

        :param model_card: Model card dictionary, defaults to None

        ..note:: If a model card is not provided, the current model card attribute value is used
        """
        self._update_card(card=model_card)

    def create_experiment(
        self,
    ) -> Experiment:
        """Create an experiment locally

        :return: An experiment object
        """
        return Experiment.create(model=self)

    def create_release(
        self,
        version: Version | str,
        notes: str,
        files: list[str] | None = None,
        images: list[str] | None = None,
        minor: bool = False,
        draft: bool = True,
    ) -> Release:
        """Call the Release.create method to build a release from Bailo and upload it.

        :param version: A semantic version for the release
        :param notes: Notes on release, defaults to ""
        :param files: A list of files for release, defaults to []
        :param images: A list of images for release, defaults to []
        :param minor: Is a minor release?, defaults to False
        :param draft: Is a draft release?, defaults to True
        :return: Release object
        """
        if self.model_card_schema:
            return Release.create(
                client=self.client,
                model_id=self.model_id,
                version=version,
                notes=notes,
                model_card_version=self.model_card_version,
                files=files,
                images=images,
                minor=minor,
                draft=draft,
            )
        raise BailoException("Create a model card before creating a release")

    def get_releases(self) -> list[Release]:
        """Get all releases for the model.

        :return: List of Release objects
        """
        res = self.client.get_all_releases(model_id=self.model_id)
        releases = []

        for release in res["releases"]:
            releases.append(self.get_release(version=release["semver"]))

        logger.info(f"Successfully retrieved all releases for model %s.", self.model_id)

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
        if releases == []:
            raise BailoException("This model has no releases.")

        latest_release = max(releases)
        logger.info(f"latest_release (%s) for %s retrieved successfully.", str(latest_release.version), self.model_id)

        return max(releases)

    def get_images(self):
        """Get all model image references for the model.

        :return: List of images
        """
        res = self.client.get_all_images(model_id=self.model_id)

        logger.info(f"Images for %s retreived successfully.", self.model_id)

        return res["images"]

    def get_image(self):
        """Get a model image reference.

        :raises NotImplementedError: Not implemented error.
        """
        raise NotImplementedError

    @property
    def model_card(self):
        return self._card

    @model_card.setter
    def model_card(self, value):
        self._card = value

    @property
    def model_card_version(self):
        return self._card_version

    @model_card_version.setter
    def model_card_version(self, value):
        self._card_version = value

    @property
    def model_card_schema(self):
        return self._card_schema

    @model_card_schema.setter
    def model_card_schema(self, value):
        self._card_schema = value


class Experiment:
    """Represent an experiment locally.

    :param model: A Bailo model object which the experiment is being run on
    :param raw: Raw information about the experiment runs

    .. code-block:: python

       experiment = model.create_experiment()
       for x in range(5):
           experiment.start_run()
           experiment.log_params({"lr": 0.01})
           ### INSERT MODEL TRAINING HERE ###
           experiment.log_metrics("accuracy": 0.86)
           experiment.log_artifacts(["weights.pth"])

       experiment.publish(mc_loc="performance.performanceMetrics", run_id=1)

    """

    def __init__(
        self,
        model: Model,
    ):
        self.model = model
        self.raw = []
        self.run = -1
        self.temp_dir = os.path.join(tempfile.gettempdir(), "bailo_runs")

    @classmethod
    def create(
        cls,
        model: Model,
    ) -> Experiment:
        """Create an experiment locally.

        :param model: A Bailo model object which the experiment is being run on
        :return: Experiment object
        """

        return cls(model=model)

    def start_run(self, is_mlflow: bool = False):
        """Starts a new experiment run.

        :param is_mlflow: Marks a run as MLFlow
        """
        self.run += 1

        self.run_data = {"run": self.run, "params": [], "metrics": [], "artifacts": [], "dataset": ""}

        self.raw.append(self.run_data)

        if not is_mlflow:
            logger.info(f"Bailo tracking run %d.", self.run)

    def log_params(self, params: dict[str, Any]):
        """Logs parameters to the current run.

        :param params: Dictionary of parameters to be logged
        """
        self.run_data["params"].append(params)

    def log_metrics(self, metrics: dict[str, Any]):
        """Logs metrics to the current run.

        :param metrics: Dictionary of metrics to be logged
        """
        self.run_data["metrics"].append(metrics)

    def log_artifacts(self, artifacts: list):
        """Logs artifacts to the current run.

        :param artifacts: A list of artifact paths to be logged
        """
        self.run_data["artifacts"].extend(artifacts)

    def log_dataset(self, dataset: str):
        """Logs a dataset to the current run.

        :param dataset: Arbitrary title of dataset
        """
        self.run_data["dataset"] = dataset

    def from_mlflow(self, tracking_uri: str, experiment_id: str):
        """Imports information from an MLFlow Tracking experiment.

        :param tracking_uri: MLFlow Tracking server URI
        :param experiment_id: MLFlow Tracking experiment ID
        :raises ImportError: Import error if MLFlow not installed
        """
        if ml_flow:
            client = mlflow.tracking.MlflowClient(tracking_uri=tracking_uri)
            runs = client.search_runs(experiment_id)
            if len(runs):
                logger.info(
                    f"Successfully retrieved MLFlow experiment %s from tracking server. %d were found.",
                    experiment_id,
                    len(runs),
                )
            else:
                warnings.warn(
                    f"MLFlow experiment {experiment_id} does not have any runs and publishing requires at least one valid run. Are you sure the ID is correct?"
                )

            for run in runs:
                data = run.data
                info = run.info
                inputs = run.inputs

                artifact_uri = info.artifact_uri
                run_id = info.run_id
                status = info.status
                datasets = inputs.dataset_inputs
                datasets_str = [dataset.name for dataset in datasets]

                artifacts = []

                # MLFlow run must be status FINISHED
                if status != "FINISHED":
                    continue

                if len(mlflow.artifacts.list_artifacts(artifact_uri=artifact_uri)):
                    mlflow_dir = os.path.join(self.temp_dir, f"mlflow_{run_id}")
                    mlflow.artifacts.download_artifacts(artifact_uri=artifact_uri, dst_path=mlflow_dir)
                    artifacts.append(mlflow_dir)
                    logger.info(
                        f"Successfully downloaded artifacts for MLFlow experiment %s to %s.", experiment_id, mlflow_dir
                    )

                self.start_run(is_mlflow=True)
                self.log_params(data.params)
                self.log_metrics(data.metrics)
                self.log_artifacts(artifacts)
                self.log_dataset("".join(datasets_str))
                self.run_data["run"] = info.run_id

            logger.info(f"Successfully imported MLFlow experiment %s.", experiment_id)
        else:
            raise ImportError("Optional MLFlow dependencies (needed for this method) are not installed.")

    def publish(self, mc_loc: str, run_id: str, semver: str = "0.1.0", notes: str = ""):
        """Publishes a given experiments results to the model card.

        :param mc_loc: Location of metrics in the model card (e.g. performance.performanceMetrics)
        :param run_id: Local experiment run ID to be selected
        :param semver: Semantic version of release to create (if artifacts present), defaults to 0.1.0 or next
        :param notes: Notes for release, defaults to ""

        ..note:: mc_loc is dependent on the model card schema being used
        """
        mc = self.model.model_card
        if mc is None:
            raise BailoException("Model card needs to be populated before publishing an experiment.")

        mc = NestedDict(mc)

        if len(self.raw):
            for run in self.raw:
                if run["run"] == run_id:
                    sel_run = run
                    break
            else:
                raise NameError(f"Run {run_id} does not exist.")
        else:
            raise BailoException(f"This experiment has no runs to publish.")

        values = []

        for metric in sel_run["metrics"]:
            for k, v in metric.items():
                values.append({"name": k, "value": v})

        # Updating the model card
        parsed_values = [{"dataset": sel_run["dataset"], "datasetMetrics": values}]
        mc[tuple(mc_loc.split("."))] = parsed_values
        self.model.update_model_card(model_card=mc)

        # Creating a release and uploading artifacts (if artifacts present)
        artifacts = sel_run["artifacts"]
        if len(artifacts):
            # Create new release
            try:
                release_latest_version = self.model.get_latest_release().version
                release_new_version = release_latest_version.next_minor()
            except:
                release_new_version = semver

            run_id = sel_run["run"]
            notes = f"{notes} (Run ID: {run_id})"
            release_new = self.model.create_release(version=release_new_version, minor=True, notes=notes)

            logger.info(
                f"Uploading %d artifacts to version %s of model %s.",
                len(artifacts),
                str(release_new_version),
                self.model.model_id,
            )

            for artifact in artifacts:
                release_new.upload(path=artifact)

            if os.path.exists(self.temp_dir) and os.path.isdir(self.temp_dir):
                shutil.rmtree(self.temp_dir)

        logger.info(f"Successfully published experiment run %s to model %s.", str(run_id), self.model.model_id)
