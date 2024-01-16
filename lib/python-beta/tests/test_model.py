from __future__ import annotations

import pytest
from bailo import Client, Model, ModelVisibility
from bailo.core.exceptions import BailoException


def test_model():
    client = Client("https://example.com")
    visibility = ModelVisibility.PUBLIC

    model = Model(
        client=client,
        model_id="test-id",
        name="test",
        description="test",
        visibility=visibility,
    )

    assert isinstance(model, Model)


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "description", "team_id", "visibility"),
    [("test-model", "test", "Uncategorised", ModelVisibility.PUBLIC), ("test-model", "test", "Uncategorised", None)],
)
def test_create_get_from_version_and_update(
    name: str,
    description: str,
    team_id: str,
    visibility: ModelVisibility | None,
    integration_client: Client,
):
    # Create model
    model = Model.create(
        client=integration_client,
        name=name,
        description=description,
        team_id=team_id,
        visibility=visibility,
    )
    model.card_from_schema("minimal-general-v10-beta")
    assert isinstance(model, Model)

    # Check that a model can be changed
    model.description = "testing-1234"
    model.update()

    get_model = Model.from_id(integration_client, model.model_id)

    assert get_model.description == "testing-1234"

    assert model.model_id == get_model.model_id


@pytest.mark.integration
def test_get_and_update_latest_model_card(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        team_id="Uncategorised",
        visibility=ModelVisibility.PUBLIC,
    )

    model.card_from_schema("minimal-general-v10-beta")

    model.get_card_latest()

    assert model.model_card_schema == "minimal-general-v10-beta"


@pytest.mark.integration
def get_model_card_without_creation(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        team_id="Uncategorised",
        visibility=ModelVisibility.PUBLIC,
    )
    model.card_from_schema("minimal-general-v10-beta")

    with pytest.raises(BailoException):
        model.get_card_latest()


@pytest.mark.integration
def test_get_releases(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        team_id="Uncategorised",
        visibility=ModelVisibility.PUBLIC,
    )
    model.card_from_schema("minimal-general-v10-beta")
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
        team_id="Uncategorised",
        visibility=ModelVisibility.PUBLIC,
    )

    with pytest.raises(BailoException):
        model.create_release("1.0.0", "test")
