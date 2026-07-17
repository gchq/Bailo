from __future__ import annotations

import json
import random

import pytest

# isort: split

from bailo import Client, ModelVisibility, SchemaKind
from bailo.core.enums import CollaboratorEntry, EntryKind, Role
from bailo.core.exceptions import BailoException, ResponseException
from bailo.core.utils import normalise_query_params
from example_schemas import METRICS_JSON_SCHEMA

mock_result = {"success": True}


def test_bailo_exception(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test_model", status_code=400, json={"error": {"message": "Dummy error!"}}
    )
    client = Client("https://example.com")
    with pytest.raises(BailoException) as bailo_exception:
        client.get_model("test_model")

        assert bailo_exception == "Dummy error!"


def test_response_exception(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_model", status_code=400, json=None)
    client = Client("https://example.com")
    with pytest.raises(ResponseException):
        client.get_model("test_model")


def test_bailo_exception_with_validation_context(requests_mock):
    error_response = {
        "error": {
            "name": "Bailo Error",
            "message": "Model metadata could not be validated against the schema.",
            "context": {
                "validationErrors": [
                    {"property": "instance.overview.tags", "message": "String does not match pattern"},
                    {"property": "instance.overview.modelSummary", "message": "is required"},
                ]
            },
        }
    }
    requests_mock.put(
        "https://example.com/api/v2/model/test_id/model-cards",
        status_code=400,
        json=error_response,
    )
    client = Client("https://example.com")
    with pytest.raises(BailoException) as exc_info:
        client.put_model_card(model_id="test_id", metadata={"invalid": "data"})

    exc = exc_info.value
    assert exc.status_code == 400
    assert exc.context is not None
    assert "validationErrors" in exc.context
    assert len(exc.context["validationErrors"]) == 2

    error_str = str(exc)
    assert "[400]" in error_str
    assert "Validation errors:" in error_str
    assert "instance.overview.tags" in error_str
    assert "instance.overview.modelSummary" in error_str


def test_bailo_exception_with_generic_context(requests_mock):
    error_response = {
        "error": {
            "name": "Bailo Error",
            "message": "Schema not found.",
            "context": {"modelId": "abc-123"},
        }
    }
    requests_mock.get(
        "https://example.com/api/v2/model/test_id",
        status_code=404,
        json=error_response,
    )
    client = Client("https://example.com")
    with pytest.raises(BailoException) as exc_info:
        client.get_model("test_id")

    exc = exc_info.value
    assert exc.status_code == 404
    assert exc.context == {"modelId": "abc-123"}
    assert "Context:" in str(exc)


def test_parse_json_error_in_success_response(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test_id",
        status_code=200,
        json={"error": {"message": "Unexpected error in 200 response", "context": {"key": "value"}}},
    )
    client = Client("https://example.com")
    with pytest.raises(BailoException) as exc_info:
        client.get_model("test_id")

    exc = exc_info.value
    assert exc.message == "Unexpected error in 200 response"
    assert exc.status_code == 200
    assert exc.context == {"key": "value"}


def test_parse_json_non_json_response(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test_id",
        status_code=200,
        text="This is not JSON",
    )
    client = Client("https://example.com")
    with pytest.raises(ResponseException):
        client.get_model("test_id")


def test_post_model(requests_mock):
    requests_mock.post("https://example.com/api/v2/models", json={"success": True})

    client = Client("https://example.com")
    result = client.post_model(
        name="test",
        kind=EntryKind.MODEL,
        description="test",
        visibility=ModelVisibility.PUBLIC,
        organisation="Example Organisation",
        state="Development",
        tags=["taga", "tagb"],
        collaborators=[CollaboratorEntry("user:user", [Role.OWNER])],
    )

    assert result == {"success": True}


@pytest.mark.parametrize(
    (
        "task",
        "libraries",
        "filters",
        "search",
        "organisations",
        "states",
        "allow_templating",
        "schema_id",
        "admin_access",
        "peers",
        "title_only",
    ),
    [
        ("image_classification", None, None, None, None, None, None, None, None, None, None),
        (
            None,
            ["library"],
            ["filter"],
            "hello",
            ["ExampleOrganisation"],
            ["prod"],
            True,
            "schema-id",
            True,
            ["peer1"],
            True,
        ),
    ],
)
def test_get_models(
    task,
    libraries,
    filters,
    search,
    organisations,
    states,
    allow_templating,
    schema_id,
    admin_access,
    peers,
    title_only,
    requests_mock,
):
    base_url = "https://example.com/api/v2/models/search"

    params = {
        "libraries": "".join(libraries) if libraries is not None else None,
        "organisations": "".join(organisations) if organisations is not None else None,
        "states": "".join(states) if states is not None else None,
        "filters": "".join(filters) if filters is not None else None,
        "search": search,
        "allowTemplating": allow_templating,
        "schemaId": schema_id,
        "adminAccess": admin_access,
        "peers": "".join(peers) if peers is not None else None,
        "titleOnly": title_only,
    }

    normalised_params = normalise_query_params(params)
    query = "&".join(f"{k}={v}" for k, v in normalised_params.items() if v is not None)
    requests_mock.get(
        f"{base_url}?{query}",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.get_models(
        task=task,
        libraries=libraries,
        filters=filters,
        search=search,
        organisations=organisations,
        states=states,
        allow_templating=allow_templating,
        schema_id=schema_id,
        admin_access=admin_access,
        peers=peers,
        title_only=title_only,
    )

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
        organisation="Example Organisation",
        state="Development",
        tags=["taga", "tagb", "tagc"],
    )

    assert result == {"success": True}


def test_patch_model_with_settings(requests_mock):
    requests_mock.patch("https://example.com/api/v2/model/test_id", json={"success": True})

    client = Client("https://example.com")
    result = client.patch_model(
        model_id="test_id",
        settings={"mirror": {"sourceModelId": "new-source-123"}},
    )

    assert result == {"success": True}
    assert requests_mock.last_request.json()["settings"]["mirror"]["sourceModelId"] == "new-source-123"


def test_patch_model_with_enum_types(requests_mock):
    requests_mock.patch("https://example.com/api/v2/model/test_id", json={"success": True})

    client = Client("https://example.com")
    result = client.patch_model(
        model_id="test_id",
        kind=EntryKind.MODEL,
        visibility=ModelVisibility.PUBLIC,
    )

    assert result == {"success": True}
    body = requests_mock.last_request.json()
    assert body["kind"] == "model"
    assert body["visibility"] == "public"


def test_post_model_with_settings(requests_mock):
    requests_mock.post("https://example.com/api/v2/models", json={"success": True})

    client = Client("https://example.com")
    result = client.post_model(
        name="test",
        kind=EntryKind.MIRRORED_MODEL,
        description="test",
        sourceModelId="source-123",
        settings={"ungovernedAccess": True, "allowTemplating": True},
    )

    assert result == {"success": True}
    body = requests_mock.last_request.json()
    assert body["settings"]["ungovernedAccess"] is True
    assert body["settings"]["allowTemplating"] is True
    assert body["settings"]["mirror"]["sourceModelId"] == "source-123"


def test_get_model_with_kind(requests_mock):
    requests_mock.get(
        "https://example.com/api/v2/model/test_id?kind=model&kind=mirrored-model",
        json={"success": True},
    )

    client = Client("https://example.com")
    result = client.get_model(model_id="test_id", kind=["model", "mirrored-model"])

    assert result == {"success": True}


def test_delete_model(requests_mock):
    requests_mock.delete("https://example.com/api/v2/model/test_id", json={"success": True})

    client = Client("https://example.com")
    result = client.delete_model(
        model_id="test_id",
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


def test_import_model_card_text(requests_mock):
    requests_mock.post(
        "https://example.com/api/v2/model/test_id/import-model-card-text",
        json={"metadata": {"overview": {"modelSummary": "A test model"}}},
    )

    client = Client("https://example.com")
    result = client.import_model_card_text(
        model_id="test_id",
        text="# Test Model\n\nThis is a test model that does classification.",
    )

    assert result == {"metadata": {"overview": {"modelSummary": "A test model"}}}


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
        json_schema=METRICS_JSON_SCHEMA,
        review_roles=["reviewer"],
    )

    assert result == {"success": True}


def test_get_reviews(requests_mock):
    requests_mock.get("https://example.com/api/v2/reviews?active=true", json={"success": True})

    client = Client("https://example.com")
    result = client.get_reviews(
        active=True,
    )

    assert result == {"success": True}


@pytest.mark.parametrize(("comment"), [(None, "test_comment")])
def test_post_release_review(comment, requests_mock):
    requests_mock.post("https://example.com/api/v2/model/test_id/release/1.0.0/review", json={"success": True})

    client = Client("https://example.com")
    result = client.post_release_review(
        model_id="test_id",
        version="1.0.0",
        role="test_role",
        decision="test_decision",
        comment=comment,
    )

    assert result == {"success": True}


@pytest.mark.parametrize(("comment"), [(None, "test_comment")])
def test_post_access_request_review(comment, requests_mock):
    requests_mock.post(
        "https://example.com/api/v2/model/test_id/access-request/test_access_request/review", json={"success": True}
    )

    client = Client("https://example.com")
    result = client.post_access_request_review(
        model_id="test_id",
        access_request_id="test_access_request",
        role="test_role",
        decision="test_decision",
        comment=comment,
    )

    assert result == {"success": True}


def test_get_model_roles(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/roles", json={"success": True})

    client = Client("https://example.com")
    result = client.get_model_roles(
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


def test_put_file_scan(requests_mock):
    requests_mock.put(
        "https://example.com/api/v2/filescanning/model/test_model_id/file/test_file_id/scan",
        json={"status": "Scan started"},
    )

    client = Client("https://example.com")
    result = client.put_file_scan(model_id="test_model_id", file_id="test_file_id")

    assert result == {"status": "Scan started"}


def test_put_image_scan(requests_mock):
    requests_mock.put(
        "https://example.com/api/v2/filescanning/model/test_model_id/image/test_image_name/test_image_tag/scan",
        json={"status": "Scan started"},
    )

    client = Client("https://example.com")
    result = client.put_image_scan(model_id="test_model_id", image_name="test_image_name", image_tag="test_image_tag")

    assert result == {"status": "Scan started"}


@pytest.mark.integration
def test_integration_create_and_fetch_model(integration_client: Client):
    result = integration_client.post_model(
        name="integration-test-model",
        kind=EntryKind.MODEL,
        description="integration test",
        visibility=ModelVisibility.PUBLIC,
    )

    assert "model" in result
    assert "id" in result["model"]

    model_id = result["model"]["id"]
    fetched = integration_client.get_model(model_id=model_id)

    assert fetched["model"]["id"] == model_id


@pytest.mark.integration
def test_integration_patch_model(integration_client: Client):
    created = integration_client.post_model(
        name="integration-test-model",
        kind=EntryKind.MODEL,
        description="integration test",
        visibility=ModelVisibility.PUBLIC,
    )

    model_id = created["model"]["id"]

    patched = integration_client.patch_model(
        model_id=model_id,
        name="integration-test-model-updated",
    )

    assert patched is not None

    fetched = integration_client.get_model(model_id=model_id)
    assert fetched["model"]["name"] == "integration-test-model-updated"


@pytest.mark.integration
def test_integration_delete_model(integration_client: Client):
    created = integration_client.post_model(
        name="integration-delete-model",
        kind=EntryKind.MODEL,
        description="integration delete test",
        visibility=ModelVisibility.PUBLIC,
    )

    model_id = created["model"]["id"]

    result = integration_client.delete_model(model_id=model_id)
    assert result is True or result is not None

    with pytest.raises(BailoException):
        integration_client.get_model(model_id=model_id)


@pytest.mark.integration
def test_integration_get_models_with_filters(integration_client: Client):
    models = integration_client.get_models(
        search="integration",
        allow_templating=False,
        title_only=True,
    )

    assert isinstance(models["models"], list)


@pytest.mark.integration
def test_integration_schema_lifecycle(integration_client: Client):
    schema_id = str(random.randint(1, 1000000))

    created = integration_client.post_schema(
        schema_id=schema_id,
        name="Integration Test Schema",
        description="integration schema test",
        kind=SchemaKind.MODEL,
        json_schema=METRICS_JSON_SCHEMA,
        review_roles=["reviewer"],
    )

    assert created is not None

    schema = integration_client.get_schema(schema_id=schema_id)
    assert schema["schema"]["id"] == schema_id


@pytest.mark.integration
def test_integration_release_lifecycle(integration_client: Client):
    schema_id = str(random.randint(1, 1000000))

    integration_client.post_schema(
        schema_id=schema_id,
        name="Integration Test Schema",
        description="integration schema test",
        kind=SchemaKind.MODEL,
        json_schema=METRICS_JSON_SCHEMA,
        review_roles=["reviewer"],
    )

    created = integration_client.post_model(
        name="integration-release-model",
        kind=EntryKind.MODEL,
        description="integration release test",
        visibility=ModelVisibility.PUBLIC,
    )

    model_id = created["model"]["id"]

    integration_client.model_card_from_schema(model_id, schema_id)

    card = integration_client.put_model_card(
        model_id=model_id,
        metadata={"overview": {"modelSummary": "Model summary"}, "performance": {}},
    )

    assert card is not None
    assert card["card"] is not None
    assert card["card"]["modelId"] == model_id
    assert card["card"]["schemaId"] == schema_id

    release = integration_client.post_release(
        model_id=model_id,
        model_card_version=1,
        release_version="1.0.0",
        notes="integration release",
        file_ids=[],
        images=[],
    )

    assert release is not None

    fetched = integration_client.get_release(model_id=model_id, release_version="1.0.0")
    assert fetched is not None


@pytest.mark.integration
def test_integration_put_model_card_validation_error(integration_client: Client):
    schema_id = str(random.randint(1, 1000000))

    integration_client.post_schema(
        schema_id=schema_id,
        name="Strict Schema",
        description="Schema with additionalProperties false",
        kind=SchemaKind.MODEL,
        json_schema=METRICS_JSON_SCHEMA,
        review_roles=["reviewer"],
    )

    created = integration_client.post_model(
        name="integration-validation-error-model",
        kind=EntryKind.MODEL,
        description="test validation error",
        visibility=ModelVisibility.PUBLIC,
    )
    model_id = created["model"]["id"]
    integration_client.model_card_from_schema(model_id, schema_id)

    with pytest.raises(BailoException) as exc_info:
        integration_client.put_model_card(
            model_id=model_id,
            metadata={"overview": {"modelSummary": "Valid"}, "invalidTopLevelField": "this should fail"},
        )

    exc = exc_info.value
    assert exc.status_code == 400
    assert exc.context is not None
    assert "validationErrors" in exc.context
    assert len(exc.context["validationErrors"]) > 0

    error_str = str(exc)
    assert "Validation errors:" in error_str


@pytest.mark.integration
def test_integration_post_model_with_settings(integration_client: Client):
    result = integration_client.post_model(
        name="integration-settings-model",
        kind=EntryKind.MODEL,
        description="test settings on create",
        visibility=ModelVisibility.PUBLIC,
        settings={"allowTemplating": True},
    )

    model_id = result["model"]["id"]
    fetched = integration_client.get_model(model_id=model_id)
    assert fetched["model"]["settings"]["allowTemplating"] is True


@pytest.mark.integration
def test_integration_patch_model_with_settings(integration_client: Client):
    created = integration_client.post_model(
        name="integration-patch-settings",
        kind=EntryKind.MODEL,
        description="test patching settings",
        visibility=ModelVisibility.PUBLIC,
    )

    model_id = created["model"]["id"]

    integration_client.patch_model(
        model_id=model_id,
        settings={"allowTemplating": True},
    )

    fetched = integration_client.get_model(model_id=model_id)
    assert fetched["model"]["settings"]["allowTemplating"] is True


@pytest.mark.integration
def test_integration_patch_model_with_enum_types(integration_client: Client):
    created = integration_client.post_model(
        name="integration-enum-patch",
        kind=EntryKind.MODEL,
        description="test enum types in patch",
        visibility=ModelVisibility.PUBLIC,
    )

    model_id = created["model"]["id"]

    integration_client.patch_model(
        model_id=model_id,
        visibility=ModelVisibility.PRIVATE,
    )

    fetched = integration_client.get_model(model_id=model_id)
    assert fetched["model"]["visibility"] == "private"


@pytest.mark.integration
def test_integration_get_model_with_kind(integration_client: Client):
    created = integration_client.post_model(
        name="integration-kind-filter",
        kind=EntryKind.MODEL,
        description="test kind filter",
        visibility=ModelVisibility.PUBLIC,
    )

    model_id = created["model"]["id"]

    fetched = integration_client.get_model(model_id=model_id, kind=["model"])
    assert fetched["model"]["id"] == model_id

    with pytest.raises(BailoException):
        integration_client.get_model(model_id=model_id, kind=["data-card"])
