from __future__ import annotations

import json

from bailo import Client, ModelVisibility, SchemaKind
from bailo.core.enums import EntryKind

mock_result = {"success": True}


def test_post_model(requests_mock):
    requests_mock.post("https://example.com/api/v2/models", json={"success": True})

    client = Client("https://example.com")
    result = client.post_model(
        name="test",
        kind=EntryKind.MODEL,
        description="test",
        visibility=ModelVisibility.PUBLIC,
    )

    assert result == {"success": True}


def test_get_models(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/models/search?task=image_classification",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.get_models(task="image_classification")

    assert result == {"success": True}


def test_get_model(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id", json={"success": True})

    client = Client("https://example.com")
    result = client.get_model(model_id="test_id")

    assert result == {"success": True}


def test_patch_model(requests_mock):
    requests_mock.patch("https://example.com/api/v2/model/test_id", json={"success": True})

    client = Client("https://example.com")
    result = client.patch_model(
        model_id="test_id",
        name="test",
    )

    assert result == {"success": True}


def test_get_model_card(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/model-card/v1", json={"success": True})

    client = Client("https://example.com")
    result = client.get_model_card(model_id="test_id", version="v1")

    assert result == {"success": True}


def test_put_model_card(requests_mock):
    requests_mock.put("https://example.com/api/v2/model/test_id/model-cards", json={"success": True})

    x = {"test": "object"}
    y = json.dumps(x)

    client = Client("https://example.com")
    result = client.put_model_card(model_id="test_id", metadata=y)

    assert result == {"success": True}


def test_model_card_from_schema(requests_mock):
    requests_mock.post(
        "https://example.com/api/v2/model/test_id/setup/from-schema",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.model_card_from_schema(model_id="test_id", schema_id="test_id")

    assert result == {"success": True}


def test_model_card_from_template(requests_mock):
    requests_mock.post(
        "https://example.com/api/v2/model/test_id/setup/from-template",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.model_card_from_template(model_id="test_id", template_id="test_id")
    assert result == {"success": True}


def test_post_release(requests_mock):
    requests_mock.post("https://example.com/api/v2/model/test_id/releases", json={"success": True})

    client = Client("https://example.com")
    result = client.post_release(
        model_id="test_id",
        model_card_version=1,
        release_version="v1",
        notes="Test Note",
        file_ids=[],
        images=[],
    )

    assert result == {"success": True}


def test_get_all_releases(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/releases", json={"success": True})

    client = Client("https://example.com")
    result = client.get_all_releases(
        model_id="test_id",
    )

    assert result == {"success": True}


def test_get_release(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/release/v1", json={"success": True})

    client = Client("https://example.com")
    result = client.get_release(
        model_id="test_id",
        release_version="v1",
    )

    assert result == {"success": True}


def test_delete_release(requests_mock):
    requests_mock.delete("https://example.com/api/v2/model/test_id/release/v1", json={"success": True})

    client = Client("https://example.com")
    result = client.delete_release(
        model_id="test_id",
        release_version="v1",
    )

    assert result == {"success": True}


def test_get_files(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/files", json={"success": True})

    client = Client("https://example.com")
    result = client.get_files(
        model_id="test_id",
    )

    assert result == {"success": True}


# def test_start_multi_upload(requests_mock):

# def test_finish_multi_upload(requests_mock):


def test_get_all_images(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/images", json={"success": True})

    client = Client("https://example.com")
    result = client.get_all_images(
        model_id="test_id",
    )

    assert result == {"success": True}


def test_get_all_schemas(requests_mock):
    requests_mock.get("https://example.com/api/v2/schemas?kind=model", json={"success": True})

    client = Client("https://example.com")
    result = client.get_all_schemas(kind=SchemaKind.MODEL)

    assert result == {"success": True}


def test_get_schema(requests_mock):
    requests_mock.get("https://example.com/api/v2/schema/test_id", json={"success": True})

    client = Client("https://example.com")
    result = client.get_schema(schema_id="test_id")

    assert result == {"success": True}


def test_post_schema(requests_mock):
    requests_mock.post("https://example.com/api/v2/schemas", json={"success": True})

    client = Client("https://example.com")
    result = client.post_schema(
        schema_id="test_id",
        name="test",
        description="example_description",
        kind=SchemaKind.MODEL,
        json_schema={"test": "test"},
    )

    assert result == {"success": True}


def test_get_reviews(requests_mock):
    requests_mock.get("https://example.com/api/v2/reviews?active=true", json={"success": True})

    client = Client("https://example.com")
    result = client.get_reviews(
        active=True,
    )

    assert result == {"success": True}


def test_get_model_roles(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/roles", json={"success": True})

    client = Client("https://example.com")
    result = client.get_model_roles(
        model_id="test_id",
    )

    assert result == {"success": True}


def test_get_model_user_roles(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/roles/mine", json={"success": True})

    client = Client("https://example.com")
    result = client.get_model_user_roles(
        model_id="test_id",
    )

    assert result == {"success": True}


def test_get_access_request(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test_id/access-request/test_id",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.get_access_request(model_id="test_id", access_request_id="test_id")

    assert result == {"success": True}


def test_get_access_requests(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test_id/access-requests",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.get_access_requests(model_id="test_id")

    assert result == {"success": True}


def test_post_access_request(requests_mock):
    requests_mock.post(
        "https://example.com/api/v2/model/test_id/access-requests",
        json={"success": True},
    )

    x = {"overview": {"entities": ["user"], "name": "test"}}
    y = json.dumps(x)

    client = Client("https://example.com")
    result = client.post_access_request(model_id="test_id", metadata=y, schema_id="test_id")

    assert result == {"success": True}


def test_delete_access_request(requests_mock):
    requests_mock.delete(
        "https://example.com/api/v2/model/test_id/access-request/test_id",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.delete_access_request(model_id="test_id", access_request_id="test_id")

    assert result == {"success": True}


def test_patch_access_request(requests_mock):
    requests_mock.patch(
        "https://example.com/api/v2/model/test_id/access-request/test_id",
        json={"success": True},
    )

    client = Client("https://example.com")

    x = {"overview": {"entities": ["user"], "name": "test"}}
    y = json.dumps(x)

    result = client.patch_access_request(
        model_id="test_id", access_request_id="test_id", metadata=y, schema_id="test_id"
    )

    assert result == {"success": True}
