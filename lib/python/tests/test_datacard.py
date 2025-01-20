from __future__ import annotations

import pytest
from bailo import Client, Datacard, ModelVisibility, Model
from bailo.core.exceptions import BailoException


def test_datacard(local_datacard):
    assert isinstance(local_datacard, Datacard)


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "description", "visibility"),
    [
        ("test-datacard", "test", ModelVisibility.PUBLIC),
        ("test-datacard", "test", None),
    ],
)
def test_create_get_from_id_and_update(
    name: str,
    description: str,
    visibility: ModelVisibility | None,
    integration_client: Client,
):
    # Create model
    datacard = Datacard.create(
        client=integration_client,
        name=name,
        description=description,
        visibility=visibility,
    )
    datacard.card_from_schema("minimal-data-card-v10")
    assert isinstance(datacard, Datacard)

    # Check that a model can be changed
    datacard.description = "testing-1234"
    datacard.update()

    get_datacard = Datacard.from_id(integration_client, datacard.datacard_id)

    assert get_datacard.description == "testing-1234"

    assert datacard.datacard_id == get_datacard.datacard_id


@pytest.mark.integration
def test_get_and_update_latest_data_card(integration_client):
    datacard = Datacard.create(
        client=integration_client,
        name="test-datacard",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )

    datacard.card_from_schema("minimal-data-card-v10")

    datacard.get_card_latest()

    assert datacard.data_card_schema == "minimal-data-card-v10"


@pytest.mark.integration
def get_data_card_without_creation(integration_client):
    datacard = Datacard.create(
        client=integration_client,
        name="test-datacard",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )
    datacard.card_from_schema("minimal-data-card-v10")

    with pytest.raises(BailoException):
        datacard.get_card_latest()


@pytest.mark.integration
def test_get_model_as_datacard(integration_client):
    model = Model.create(
        client=integration_client,
        name="test-model",
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )

    with pytest.raises(BailoException):
        datacard = Datacard.from_id(client=integration_client, datacard_id=model.model_id)
