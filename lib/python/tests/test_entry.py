from __future__ import annotations

import pytest
from bailo import Client, Datacard, Entry, MirroredModel, Model
from bailo.core.enums import EntryKind
from bailo.core.exceptions import BailoException


def _entry_response(entry_id: str, kind: EntryKind, **extra) -> dict:
    return {
        "id": entry_id,
        "name": "test",
        "description": "test",
        "kind": kind,
        "visibility": "public",
        "collaborators": [],
        **extra,
    }


def _mirror_settings(source_model_id: str = "test-1234") -> dict:
    return {"settings": {"mirror": {"sourceModelId": source_model_id}}}


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


def test_entry_cannot_be_instantiated_directly():
    with pytest.raises(TypeError, match="cannot be instantiated directly"):
        Entry(client=Client("https://example.com"), id="test-id", name="test", description="test")


def test_subclass_without_entry_kind_is_rejected():
    with pytest.raises(TypeError, match="must define an 'entry_kind' class attribute"):

        class Kindless(Entry):
            pass


def test_create_rejects_unexpected_argument():
    client = Client("https://example.com")

    with pytest.raises(BailoException, match="unexpected argument"):
        Model.create(client=client, name="test", description="test", sourceModelId="test-1234")


def test_mirrored_create_rejects_unexpected_argument():
    client = Client("https://example.com")

    with pytest.raises(BailoException, match="unexpected argument"):
        MirroredModel.create(client=client, name="test", description="test", sourceModelId="test-1234", nonsense=True)


def test_get_releases_does_not_refetch_each_release(requests_mock):
    release = {
        "semver": "1.0.0",
        "modelCardVersion": 1,
        "notes": "test",
        "fileIds": [],
        "images": [],
        "minor": False,
        "draft": False,
    }
    list_mock = requests_mock.get("https://example.com/api/v2/model/test-id/releases", json={"releases": [release]})
    detail_mock = requests_mock.get("https://example.com/api/v2/model/test-id/release/1.0.0", json={"release": release})
    model = Model(client=Client("https://example.com"), model_id="test-id", name="test", description="test")

    releases = model.get_releases()

    assert len(releases) == 1
    assert str(releases[0].version) == "1.0.0"
    assert releases[0].notes == "test"
    assert list_mock.call_count == 1
    assert detail_mock.call_count == 0


def test_from_id_rejects_response_without_kind(requests_mock):
    response = _entry_response("test-id", EntryKind.MODEL)
    del response["kind"]
    requests_mock.get("https://example.com/api/v2/model/test-id", json={"model": response})

    with pytest.raises(BailoException, match="is of kind 'None'"):
        Model.from_id(client=Client("https://example.com"), model_id="test-id")


def test_mirrored_model_from_id_without_source_model_id(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test-id",
        json={"model": _entry_response("test-id", EntryKind.MIRRORED_MODEL, settings={})},
    )

    with pytest.raises(BailoException, match="has no settings.mirror.sourceModelId"):
        MirroredModel.from_id(client=Client("https://example.com"), model_id="test-id")


def test_search_does_not_refetch_each_result(requests_mock):
    summary = _entry_response("test-id", EntryKind.MODEL)
    summary["card"] = {"version": 1, "schemaId": "minimal-general-v10", "metadata": {"overview": {}}}
    search_mock = requests_mock.get("https://example.com/api/v2/models/search", json={"models": [summary]})
    detail_mock = requests_mock.get("https://example.com/api/v2/model/test-id", json={"model": summary})

    models = Model.search(client=Client("https://example.com"))

    assert len(models) == 1
    assert models[0].model_card_version == 1
    assert search_mock.call_count == 1
    assert detail_mock.call_count == 0


def test_mirrored_search_refetches_each_result(requests_mock):
    summary = _entry_response("test-id", EntryKind.MIRRORED_MODEL)
    detail = _entry_response("test-id", EntryKind.MIRRORED_MODEL, **_mirror_settings())
    detail["mirroredCard"] = {"version": 2, "schemaId": "minimal-general-v10", "metadata": {"overview": {}}}
    requests_mock.get("https://example.com/api/v2/models/search", json={"models": [summary]})
    detail_mock = requests_mock.get("https://example.com/api/v2/model/test-id", json={"model": detail})

    with pytest.warns(UserWarning, match="does not have any associated additional information"):
        models = MirroredModel.search(client=Client("https://example.com"))

    assert len(models) == 1
    assert models[0].sourceModelId == "test-1234"
    # One fetch to hydrate settings, one from the get_card_latest() that follows.
    assert detail_mock.call_count == 2


def test_datacard_search_filters_by_kind(requests_mock):
    search_mock = requests_mock.get(
        "https://example.com/api/v2/models/search",
        json={"models": [_entry_response("test-id", EntryKind.DATACARD)]},
    )

    datacards = Datacard.search(client=Client("https://example.com"))

    assert len(datacards) == 1
    assert isinstance(datacards[0], Datacard)
    assert datacards[0].datacard_id == "test-id"
    assert search_mock.last_request.qs["kind"] == ["data-card"]


def test_create_sends_tags(requests_mock):
    requests_mock.post(
        "https://example.com/api/v2/models",
        json={"model": _entry_response("test-id", EntryKind.MODEL)},
    )
    client = Client("https://example.com")

    Model.create(client=client, name="test", description="test", tags=["a", "b"])

    assert requests_mock.last_request.json()["tags"] == ["a", "b"]
