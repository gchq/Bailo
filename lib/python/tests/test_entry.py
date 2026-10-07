from __future__ import annotations

import pytest
from bailo import Client, Datacard, MirroredModel, Model
from bailo.core.enums import EntryKind
from bailo.core.exceptions import BailoException


def _entry_response(entry_id: str, kind: EntryKind) -> dict:
    return {
        "id": entry_id,
        "name": "test",
        "description": "test",
        "kind": kind,
        "visibility": "public",
        "collaborators": [],
    }


def test_model_id_tracks_id_after_unpack(local_model):
    local_model._unpack(_entry_response("renamed-id", EntryKind.MODEL))

    assert local_model.id == "renamed-id"
    assert local_model.model_id == "renamed-id"


def test_datacard_id_tracks_id_after_unpack(local_datacard):
    local_datacard._unpack(_entry_response("renamed-id", EntryKind.DATACARD))

    assert local_datacard.id == "renamed-id"
    assert local_datacard.datacard_id == "renamed-id"


def test_mirrored_model_id_tracks_id_after_unpack(local_mirrored_model):
    local_mirrored_model._unpack(_entry_response("renamed-id", EntryKind.MIRRORED_MODEL))

    assert local_mirrored_model.id == "renamed-id"
    assert local_mirrored_model.model_id == "renamed-id"


def test_setting_id_alias_updates_id(local_model):
    local_model.model_id = "new-id"

    assert local_model.id == "new-id"


@pytest.mark.parametrize(
    "entry_class, id_kwarg, actual_kind",
    [
        (Model, "model_id", EntryKind.DATACARD),
        (Datacard, "datacard_id", EntryKind.MODEL),
        (MirroredModel, "model_id", EntryKind.MODEL),
    ],
)
def test_from_id_rejects_mismatched_kind(entry_class, id_kwarg, actual_kind, requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test-id",
        json={"model": _entry_response("test-id", actual_kind)},
    )
    client = Client("https://example.com")

    with pytest.raises(BailoException, match="is of kind"):
        entry_class.from_id(client=client, **{id_kwarg: "test-id"})


@pytest.mark.parametrize(
    "fixture_name",
    ["local_model", "local_datacard", "local_mirrored_model"],
)
def test_repr_and_str_are_consistent(fixture_name, request):
    entry = request.getfixturevalue(fixture_name)

    assert str(entry) == "test-id"
    assert repr(entry) == f"{entry.__class__.__name__}(test-id)"


def test_model_card_aliases_share_state_with_entry_card(local_model):
    local_model.model_card = {"overview": {"summary": "via alias"}}
    local_model.model_card_version = 3
    local_model.model_card_schema = "minimal-general-v10"

    assert local_model.card == {"overview": {"summary": "via alias"}}
    assert local_model.card_version == 3
    assert local_model.card_schema == "minimal-general-v10"

    local_model.card = {"overview": {"summary": "via entry"}}

    assert local_model.model_card == {"overview": {"summary": "via entry"}}


def test_data_card_aliases_share_state_with_entry_card(local_datacard):
    local_datacard.data_card = {"overview": {"summary": "via alias"}}
    local_datacard.data_card_version = 2
    local_datacard.data_card_schema = "minimal-data-card-v10"

    assert local_datacard.card == {"overview": {"summary": "via alias"}}
    assert local_datacard.card_version == 2
    assert local_datacard.card_schema == "minimal-data-card-v10"

    local_datacard.card = {"overview": {"summary": "via entry"}}

    assert local_datacard.data_card == {"overview": {"summary": "via entry"}}


def test_entry_kind_is_set_per_subclass():
    assert Model.entry_kind == EntryKind.MODEL
    assert Datacard.entry_kind == EntryKind.DATACARD
    assert MirroredModel.entry_kind == EntryKind.MIRRORED_MODEL


def test_create_sends_tags(requests_mock):
    requests_mock.post(
        "https://example.com/api/v2/models",
        json={"model": _entry_response("test-id", EntryKind.MODEL)},
    )
    client = Client("https://example.com")

    Model.create(client=client, name="test", description="test", tags=["a", "b"])

    assert requests_mock.last_request.json()["tags"] == ["a", "b"]
