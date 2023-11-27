from __future__ import annotations

import pytest
from bailo.core import Client, ModelVisibility
from bailo.helper import Model


def test_model():
    client = Client("https://example.com")
    visibility = ModelVisibility.Public

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
    ("name", "description", "team_id", "visibility"), [("test-model", "test", "Uncategorised", ModelVisibility.Public)]
)
def test_create_get_from_version_and_update(
    name: str, description: str, team_id: str, visibility: ModelVisibility | None, integration_client
):
    # Create model
    model = Model.create(
        client=integration_client, name=name, description=description, team_id=team_id, visibility=visibility
    )
    model.card_from_schema("minimal-general-v10-beta")
    assert isinstance(model, Model)

    # Check that a model can be changed
    model.description = "testing-1234"
    model.update()

    get_model = Model.from_id(integration_client, model.model_id)

    assert get_model.description == "testing-1234"

    assert model.model_id == get_model.model_id
