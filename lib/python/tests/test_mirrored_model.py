from __future__ import annotations

import pytest
from bailo.core.enums import CollaboratorEntry, MinimalSchema, Role

# isort: split

from bailo import Client, Datacard, Experiment, MirroredModel, ModelVisibility
from bailo.core.exceptions import BailoException
from bailo.core.utils import NestedDict


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
def test_create_get_from_id_and_update(
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
