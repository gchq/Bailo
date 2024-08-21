from __future__ import annotations

import os
import shutil
import tempfile
from typing import Any
import logging
import warnings

from bailo.core.client import Client
from bailo.core.enums import EntryKind, ModelVisibility, MinimalSchema
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
        logger.info("Model successfully created on server with ID {model_id}.")

        model = cls(
            client=client,
            model_id=model_id,
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

    @classmethod
    def search(
        cls,
        client: Client,
        task: str | None = None,
        libraries: list[str] | None = None,
        filters: list[str] | None = None,
        search: str = "",
    ) -> list[Model]:
        """Return a list of model objects from Bailo, based on search parameters.

        :param client: A client object used to interact with Bailo
        :param task: Model task (e.g. image classification), defaults to None
        :param libraries: Model library (e.g. TensorFlow), defaults to None
        :param filters: Custom filters, defaults to None
        :param search: String to be located in model cards, defaults to ""
        :return: List of model objects
        """
        res = client.get_models(task=task, libraries=libraries, filters=filters, search=search)
        models = []

        for model in res["models"]:
            res_model = client.get_model(model_id=model["id"])["model"]
            model_obj = cls(client=client, model_id=model["id"], name=model["name"], description=model["description"])
            model_obj._unpack(res_model)
            model_obj.get_card_latest()
            models.append(model_obj)

        return models

    @classmethod
    def from_mlflow(
        cls,
        client: Client,
        mlflow_uri: str,
        team_id: str,
        name: str,
        schema_id: str = MinimalSchema.MODEL,
        version: str | None = None,
        files: bool = True,
        visibility: ModelVisibility | None = None,
    ) -> Model:
        """Import an MLFlow Model into Bailo.

        :param client: A client object used to interact with Bailo
        :param mlflow_uri: MLFlow server URI
        :param team_id: A unique team ID
        :param name: Name of model (on MLFlow). Same name will be used on Bailo
        :param schema_id: A unique schema ID, only required when files is True, defaults to minimal-general-v10
        :param version: Specific MLFlow model version to import, defaults to None
        :param files: Import files?, defaults to True
        :param visibility: Visibility of model on Bailo, using ModelVisibility enum (e.g Public or Private), defaults to None
        :return: A model object
        """
        if not ml_flow:
            raise ImportError("Optional MLFlow dependencies (needed for this method) are not installed.")

        mlflow_client = mlflow.tracking.MlflowClient(tracking_uri=mlflow_uri)
        mlflow.set_tracking_uri(mlflow_uri)
        filter_string = f"name = '{name}'"

        res = mlflow_client.search_model_versions(filter_string=filter_string, order_by=["version_number DESC"])
        if not len(res):
            raise BailoException("No MLFlow models found. Are you sure the name/alias/version provided is correct?")

        sel_model = None
        if version:
            for model in res:
                if model.version == version:
                    sel_model = model
        else:
            sel_model = res[0]

        if sel_model is None:
            raise BailoException("No MLFlow model found. Are you sure the name/alias/version provided is correct?")

        name = sel_model.name
        description = str(sel_model.description) + " Imported from MLFlow."
        bailo_res = client.post_model(
            name=name, kind=EntryKind.MODEL, description=description, team_id=team_id, visibility=visibility
        )
        model_id = bailo_res["model"]["id"]
        logger.info("MLFlow model successfully imported to Bailo with ID {model_id}.")

        model = cls(
            client=client,
            model_id=model_id,
            name=name,
            description=description,
            visibility=visibility,
        )
        model._unpack(bailo_res["model"])

        if files:
            model.card_from_schema(schema_id=schema_id)
            release = model.create_release(version=Version.coerce(str(sel_model.version)), notes=" ")
            run_id = sel_model.run_id
            if run_id is None:
                raise BailoException(
                    "MLFlow model does not have an assosciated run_id, therefore artifacts cannot be transfered."
                )

            mlflow_run = mlflow_client.get_run(run_id)
            artifact_uri: str = str(mlflow_run.info.artifact_uri)
            if artifact_uri is None:
                raise BailoException("Artifact URI could not be found, therefore artifacts cannot be transfered.")

            if mlflow.artifacts.list_artifacts(artifact_uri=artifact_uri) is not None:
                temp_dir = os.path.join(tempfile.gettempdir(), "mlflow_model")
                mlflow_dir = os.path.join(temp_dir, f"mlflow_{run_id}")
                mlflow.artifacts.download_artifacts(artifact_uri=artifact_uri, dst_path=mlflow_dir)
                release.upload(mlflow_dir)
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

        logger.info("Successfully retrieved all releases for model {self.model_id}.")

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
        logger.info(f"latest_release (%s) for %s retrieved successfully.", str(latest_release.version), self.model_id)

        return max(releases)

    def get_images(self):
        """Get all model image references for the model.

        :return: List of images
        """
        res = self.client.get_all_images(model_id=self.model_id)

        logger.info("Images for {self.model_id} retreived successfully.")

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

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({str(self)})"

    def __str__(self) -> str:
        return f"{self.model_id}"


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
        self.published = False

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
            logger.info(f"Bailo tracking run {self.run}.")

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
        if not ml_flow:
            raise ImportError("Optional MLFlow dependencies (needed for this method) are not installed.")

        client = mlflow.tracking.MlflowClient(tracking_uri=tracking_uri)
        runs = client.search_runs([experiment_id])
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

            artifact_uri: str = str(info.artifact_uri)
            run_id = info.run_id
            status = info.status
            datasets = inputs.dataset_inputs
            datasets_str = [dataset.dataset.name for dataset in datasets]

            artifacts = []
            # MLFlow run must be status FINISHED
            if status != "FINISHED":
                continue

            if mlflow.artifacts.list_artifacts(artifact_uri=artifact_uri) is not None:
                mlflow_dir = os.path.join(self.temp_dir, f"mlflow_{run_id}")
                mlflow.artifacts.download_artifacts(artifact_uri=artifact_uri, dst_path=mlflow_dir)
                artifacts.append(mlflow_dir)
                logger.info(f"Successfully downloaded artifacts for MLFlow experiment {experiment_id} to {mlflow_dir}.")

            self.start_run(is_mlflow=True)
            self.log_params(data.params)
            self.log_metrics(data.metrics)
            self.log_artifacts(artifacts)
            self.log_dataset("".join(datasets_str))
            self.run_data["run"] = info.run_id

        logger.info(f"Successfully imported MLFlow experiment %s.", experiment_id)

    def publish(
        self,
        mc_loc: str,
        semver: str = "0.1.0",
        notes: str = "",
        run_id: str | None = None,
        select_by: str | None = None,
    ):
        """Publishes a given experiments results to the model card.

        :param mc_loc: Location of metrics in the model card (e.g. performance.performanceMetrics)
        :param semver: Semantic version of release to create (if artifacts present), defaults to 0.1.0 or next
        :param notes: Notes for release, defaults to ""
        :param run_id: Local experiment run ID to be selected, defaults to None
        :param select_by: String describing experiment to be selected (e.g. "accuracy MIN|MAX"), defaults to None

        ..note:: mc_loc is dependent on the model card schema being used
        ..warning:: User must specify either run_id or select_by, otherwise the code will error
        """
        if self.published:
            raise BailoException("This experiment has already been published.")
        mc = self.model.model_card
        if mc is None:
            raise BailoException("Model card needs to be populated before publishing an experiment.")

        mc = NestedDict(mc)

        if len(self.raw) == 0:
            raise BailoException(f"This experiment has no runs to publish.")
        if (select_by is None) and (run_id is None):
            raise BailoException(
                "Either select_by (e.g. 'accuracy MIN|MAX') or run_id is required to publish an experiment run."
            )

        sel_run: dict
        if (select_by is not None) and (run_id is None):
            sel_run = self.__select_run(select_by=select_by)

        if run_id is not None:
            for run in self.raw:
                if run["run"] == run_id:
                    sel_run = run
                    break
            else:
                raise NameError(f"Run {run_id} does not exist.")

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
            self.published = True

            if os.path.exists(self.temp_dir) and os.path.isdir(self.temp_dir):
                shutil.rmtree(self.temp_dir)

        logger.info(f"Successfully published experiment run %s to model %s.", str(run_id), self.model.model_id)

    def __select_run(self, select_by: str) -> dict:
        # Parse target and order from select_by string
        select_by_split = select_by.split(" ")
        if len(select_by_split) != 2:
            raise BailoException("Invalid select_by string. Expected format is 'metric_name MIN|MAX'.")
        order_str = select_by_split[1].upper()
        order_opt = ["MIN", "MAX"]
        if order_str not in order_opt:
            raise BailoException(f"Runs can only be ordered by MIN or MAX, not {order_str}.")
        target_str = select_by_split[0]

        # Extract target value for each run
        runs = self.raw
        for run in runs:
            metrics = run["metrics"]
            for metric in metrics:
                target_value = metric.get(target_str, None)
            if target_value is not None:
                run["target"] = target_value
            else:
                raise BailoException(
                    f"Target '{target_str}' could not be found in at least one experiment run, or is not an integer. Therefore ordering cannot take place."
                )

        # Sort experiment runs by target value into ascending order, and select first or last depending on order_str
        ordered_runs = sorted(runs, key=lambda run: run["target"])
        if order_str == "MIN":
            return ordered_runs[0]
        else:  # MAX
            return ordered_runs[-1]
