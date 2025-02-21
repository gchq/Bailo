from __future__ import annotations

import pytest

# isort: split

from bailo import Client, Datacard, Experiment, Model, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.core.utils import NestedDict


def test_model(local_model):
    assert isinstance(local_model, Model)


def test_create_experiment_from_model(local_model):
    experiment = local_model.create_experiment()

    assert isinstance(experiment, Experiment)


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "description", "organisation", "state", "visibility"),
    [
        ("test-model", "test", None, None, ModelVisibility.PUBLIC),
        ("test-model", "test", None, None, None),
        ("test-model", "test", "Example Organisation", "Development", None),
    ],
)
def test_create_get_from_id_and_update(
    name: str,
    description: str,
    visibility: ModelVisibility | None,
    organisation: str | None,
    state: str | None,
    integration_client: Client,
):
    # Create model
    model = Model.create(
        client=integration_client,
        name=name,
        description=description,
        visibility=visibility,
        organisation=organisation,
        state=state,
    )
    model.card_from_schema("minimal-general-v10")
    assert isinstance(model, Model)

    # Check that a model can be changed
    model.description = "testing-1234"
    model.update()

    get_model = Model.from_id(integration_client, model.model_id)

    assert get_model.description == "testing-1234"

    assert model.model_id == get_model.model_id


@pytest.mark.integration
def test_search_models(integration_client):
    models = Model.search(client=integration_client)

    assert all(isinstance(model, Model) for model in models)


@pytest.mark.integration
def test_search_models_specific(integration_client):
    models = Model.search(client=integration_client, search="You only look once!")

    assert all(model.name == "Yolo-v4" for model in models)


@pytest.mark.integration
def test_get_and_update_latest_model_card(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )

    model.card_from_schema("minimal-general-v10")

    model.get_card_latest()

    assert model.model_card_schema == "minimal-general-v10"


@pytest.mark.integration
def get_model_card_without_creation(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )
    model.card_from_schema("minimal-general-v10")

    with pytest.raises(BailoException):
        model.get_card_latest()


@pytest.mark.integration
def test_get_releases(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )
    model.card_from_schema("minimal-general-v10")
    # Add two releases to the model
    release_1 = model.create_release("1.0.1", "test")
    release_2 = model.create_release("1.0.0", "test")

    releases = model.get_releases()

    assert release_1 in releases
    assert release_2 in releases

    # Check latest release is highest semver
    assert model.get_latest_release().version == release_1.version


@pytest.mark.integration
def test_create_release_without_model_card(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )

    with pytest.raises(BailoException):
        model.create_release("1.0.0", "test")


@pytest.mark.integration
def test_get_datacard_as_model(integration_client):
    datacard = Datacard.create(
        client=integration_client,
        name="test-datacard",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )

    with pytest.raises(BailoException):
        model = Model.from_id(client=integration_client, model_id=datacard.datacard_id)


@pytest.mark.integration
def test_publish_experiment_standard(standard_experiment):
    run_id = standard_experiment.raw[0]["run"]
    standard_experiment.publish(mc_loc="performance.performanceMetrics", run_id=run_id)

    model_card = standard_experiment.model.model_card
    model_card = NestedDict(model_card)
    metrics_array = model_card[("performance", "performanceMetrics")][0]["datasetMetrics"]

    expected_accuracy = 0.1
    actual_accuracy = metrics_array[0]["value"]

    assert expected_accuracy == actual_accuracy


@pytest.mark.integration
def test_publish_experiment_standard_ordered(standard_experiment):
    standard_experiment.publish(mc_loc="performance.performanceMetrics", select_by="accuracy MAX")

    model_card = standard_experiment.model.model_card
    model_card = NestedDict(model_card)
    metrics_array = model_card[("performance", "performanceMetrics")][0]["datasetMetrics"]

    expected_accuracy = 0.5
    actual_accuracy = metrics_array[0]["value"]

    assert expected_accuracy == actual_accuracy


@pytest.mark.integration
def test_publish_experiment_standard_invalid_select_by(standard_experiment):
    with pytest.raises(BailoException):
        standard_experiment.publish(mc_loc="performance.performanceMetrics", select_by="MAX:accuracy")


@pytest.mark.mlflow
def test_import_model_from_mlflow(integration_client, mlflow_model, request):
    model = Model.from_mlflow(
        client=integration_client,
        mlflow_uri=request.config.mlflow_uri,
        schema_id="minimal-general-v10",
        name=mlflow_model,
    )

    assert len(model.get_releases()) == 1
    assert model.name == mlflow_model


@pytest.mark.mlflow
def test_import_nonexistent_model_from_mlflow(integration_client, request):
    with pytest.raises(BailoException):
        model = Model.from_mlflow(
            client=integration_client,
            mlflow_uri=request.config.mlflow_uri,
            schema_id="minimal-general-v10",
            name="fake-model-name",
        )


@pytest.mark.mlflow
def test_import_model_files_no_run(integration_client, mlflow_model_no_run, request):
    with pytest.raises(BailoException):
        model = Model.from_mlflow(
            client=integration_client,
            mlflow_uri=request.config.mlflow_uri,
            schema_id="minimal-general-v10",
            name=mlflow_model_no_run,
        )


@pytest.mark.mlflow
def test_import_model_no_schema(integration_client, mlflow_model, request):
    with pytest.raises(BailoException):
        model = Model.from_mlflow(
            client=integration_client,
            mlflow_uri=request.config.mlflow_uri,
            name=mlflow_model,
        )


@pytest.mark.mlflow
def test_import_experiment_from_mlflow_and_publish(mlflow_id, example_model, request):
    experiment_mlflow = example_model.create_experiment()
    experiment_mlflow.from_mlflow(tracking_uri=request.config.mlflow_uri, experiment_id=mlflow_id)

    run_id = experiment_mlflow.raw[0]["run"]
    experiment_mlflow.publish(mc_loc="performance.performanceMetrics", run_id=run_id)

    model_card = experiment_mlflow.model.model_card
    model_card = NestedDict(model_card)
    metrics_array = model_card[("performance", "performanceMetrics")][0]["datasetMetrics"]

    expected_accuracy = 0.86
    actual_accuracy = metrics_array[0]["value"]

    assert expected_accuracy == actual_accuracy


@pytest.mark.integration
def test_publish_experiment_without_valid_id(standard_experiment):
    run_id = "random_incorrect_id"

    with pytest.raises(NameError):
        standard_experiment.publish(mc_loc="performance.performanceMetrics", run_id=run_id)


@pytest.mark.integration
def test_publish_experiment_without_valid_model_card(standard_experiment):
    standard_experiment.model.model_card = None
    run_id = standard_experiment.raw[0]["run"]

    with pytest.raises(BailoException):
        standard_experiment.publish(mc_loc="performance.performanceMetrics", run_id=run_id)


@pytest.mark.integration
def test_publish_experiment_without_runs(standard_experiment):
    standard_experiment.raw = []
    run_id = 0

    with pytest.raises(BailoException):
        standard_experiment.publish(mc_loc="performance.performanceMetrics", run_id=run_id)
