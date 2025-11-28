from __future__ import annotations

import pytest

# isort: split

from bailo import Client, Datacard, Model, ModelVisibility
from bailo.core.enums import CollaboratorEntry, Role
from bailo.core.exceptions import BailoException


def test_datacard(local_datacard):
    assert isinstance(local_datacard, Datacard)


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "description", "organisation", "state", "tags", "visibility", "collaborators"),
    [
        ("test-datacard", "test", None, None, None, ModelVisibility.PUBLIC, None),
        ("test-datacard", "test", None, None, None, None, [CollaboratorEntry("user:user", ["owner", "contributor"])]),
        (
            "test-datacard",
            "test",
            "Example Organisation",
            "Development",
            ["taga", "tagb"],
            None,
            [CollaboratorEntry("user:user", [Role.OWNER])],
        ),
    ],
)
def test_create_get_from_id_update_and_delete_datacard(
    name: str,
    description: str,
    visibility: ModelVisibility | None,
    organisation: str | None,
    state: str | None,
    tags: list[str] | None,
    collaborators: list[CollaboratorEntry] | None,
    integration_client: Client,
):
    # Create model
    datacard = Datacard.create(
        client=integration_client,
        name=name,
        description=description,
        visibility=visibility,
        organisation=organisation,
        state=state,
        tags=tags,
        collaborators=collaborators,
    )
    datacard.card_from_schema("minimal-data-card-v10")
    assert isinstance(datacard, Datacard)

    # Check that a model can be changed
    datacard.description = "testing-1234"
    datacard.update()

    get_datacard = Datacard.from_id(integration_client, datacard.datacard_id)

    assert get_datacard.description == "testing-1234"

    assert datacard.datacard_id == get_datacard.datacard_id

    # Check that the datacard is deleted
    assert datacard.delete()


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
