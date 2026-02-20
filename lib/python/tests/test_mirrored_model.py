from __future__ import annotations

import pytest
from bailo.core.enums import CollaboratorEntry, EntryKind, MinimalSchema, Role

# isort: split

from bailo import Client, Datacard, Experiment, MirroredModel, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.core.utils import NestedDict


def test_model_card_defaults(local_mirrored_model):
    assert local_mirrored_model.model_card == {
        "card": None,
        "additional_information": None,
    }

    assert local_mirrored_model.model_card_version == {
        "card": None,
        "additional_information": None,
    }


def test_get_card_latest_with_card_and_mirrored_card(local_mirrored_model, requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test-id",
        json={
            "model": {
                "id": "test-id",
                "kind": EntryKind.MIRRORED_MODEL,
                "card": {
                    "schemaId": "minimal-general-v10",
                    "version": 1,
                    "metadata": {"overview": {"summary": "some additional info"}},
                    "schema": {"id": "schema-1"},
                },
                "mirroredCard": {
                    "schemaId": "minimal-general-v10",
                    "version": 2,
                    "metadata": {"overview": {"summary": "main card"}},
                },
            }
        },
    )

    local_mirrored_model.get_card_latest()

    assert local_mirrored_model.model_card == {
        "card": {"overview": {"summary": "main card"}},
        "additional_information": {"overview": {"summary": "some additional info"}},
    }

    assert local_mirrored_model.model_card_version == {
        "card": 2,
        "additional_information": 1,
    }


def test_mirrored_model(local_mirrored_model):
    assert isinstance(local_mirrored_model, MirroredModel)


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "description", "sourceModelId", "organisation", "state", "tags", "visibility", "collaborators"),
    [
        ("test-mirrored-model", "test", "test-1234", None, None, None, ModelVisibility.PUBLIC, None),
        (
            "test-mirrored-model",
            "test",
            "test-1234",
            None,
            None,
            None,
            None,
            [CollaboratorEntry("user:user", ["owner", "contributor"])],
        ),
        (
            "test-mirrored-model",
            "test",
            "test-1234",
            "Example Organisation",
            "Development",
            ["taga", "tagb"],
            None,
            [CollaboratorEntry("user:user", [Role.OWNER])],
        ),
    ],
)
def test_create_get_from_id_update_and_delete_mirrored_model(
    name: str,
    description: str,
    sourceModelId: str,
    visibility: ModelVisibility | None,
    organisation: str | None,
    state: str | None,
    tags: list[str] | None,
    collaborators: list[CollaboratorEntry] | None,
    integration_client: Client,
):
    # Create model
    mirroredModel = MirroredModel.create(
        client=integration_client,
        name=name,
        description=description,
        sourceModelId=sourceModelId,
        visibility=visibility,
        organisation=organisation,
        state=state,
        tags=tags,
        collaborators=collaborators,
    )
    assert isinstance(mirroredModel, MirroredModel)

    # Check that a model can be changed
    mirroredModel.description = "testing-1234"
    mirroredModel.update()

    get_mirrored_model = MirroredModel.from_id(integration_client, mirroredModel.model_id)

    assert get_mirrored_model.description == "testing-1234"

    assert mirroredModel.model_id == get_mirrored_model.model_id

    # Check that the mirroredModel is deleted
    assert mirroredModel.delete()


@pytest.mark.integration
def test_search_mirrored_models_specific(integration_client, example_mirrored_model):
    mirroredModels = MirroredModel.search(client=integration_client, search="FooBarBaz!")

    assert all(model.name == "Yolo-v4" for model in mirroredModels)


@pytest.mark.integration
def test_get_releases(integration_client):
    model = MirroredModel.create(
        client=integration_client,
        name="test-model",
        description="test",
        sourceModelId="test-1234",
        visibility=ModelVisibility.PUBLIC,
    )

    releases = model.get_releases()

    with pytest.raises(BailoException):
        model.get_latest_release()
