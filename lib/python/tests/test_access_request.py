from __future__ import annotations

import pytest
from bailo import AccessRequest, Client
from bailo.core.exceptions import BailoException


def test_access_request():
    client = Client("https://example.com")

    access_request = AccessRequest(
        client=client,
        model_id="test_id",
        schema_id="test_id",
        metadata={"test": "test"},
        access_request_id="example",
        created_by="user",
    )

    assert isinstance(access_request, AccessRequest)


def test_update_access_request(requests_mock):
    requests_mock.patch("https://example.com/api/v2/model/test_id/access-request/new_example", json={"success": True})

    client = Client("https://example.com")

    access_request = AccessRequest(
        client=client,
        model_id="test_id",
        schema_id="test_id",
        metadata={"test": "test"},
        access_request_id="example",
        created_by="user",
    )

    access_request.access_request_id = "new_example"
    access_request.metadata = {"test": "test", "foo": "bar"}
    access_request.update()

    assert isinstance(access_request, AccessRequest)


def test_access_request_str():
    client = Client("https://example.com")

    access_request = AccessRequest(
        client=client,
        model_id="test_id",
        schema_id="test_id",
        metadata={"overview": {"name": "test"}},
        access_request_id="example",
        created_by="user",
    )

    assert str(access_request) == "Access Request: test - test_id"


def test_access_request_repr():
    client = Client("https://example.com")

    access_request = AccessRequest(
        client=client,
        model_id="test_id",
        schema_id="test_id",
        metadata={"overview": {"name": "test"}},
        access_request_id="example",
        created_by="user",
    )

    assert repr(access_request) == "AccessRequest(test_id,test_id)"


def test_access_request_eq():
    client = Client("https://example.com")

    access_requests = [
        AccessRequest(
            client=client,
            model_id=f"test_id{i}",
            schema_id=f"test_id{i}",
            metadata={"overview": {"name": "test"}},
            access_request_id=f"example{i}",
            created_by="user",
        )
        for i in range(2)
    ]

    assert not (access_requests[0] == access_requests[1])


def test_access_request_eq_not_implemented():
    client = Client("https://example.com")

    access_request = AccessRequest(
        client=client,
        model_id="test_id",
        schema_id="test_id",
        metadata={"overview": {"name": "test"}},
        access_request_id="example",
        created_by="user",
    )

    # NotImplemented evaluates to false
    assert not (access_request == {})


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "schema_id", "created_by", "end_date"),
    [("test", "minimal-access-request-general-v10", "user", "1970-01-01")],
)
def test_create_get_from_version_update_and_delete_access_request(
    name, schema_id, created_by, end_date, integration_client, example_model
):
    metadata = {"overview": {"entities": [created_by], "name": name, "endDate": end_date}}
    # Create access request
    ar = AccessRequest.create(
        client=integration_client,
        model_id=example_model.model_id,
        schema_id=schema_id,
        metadata=metadata,
    )

    # Get access request
    get_ar = AccessRequest.from_id(integration_client, example_model.model_id, ar.access_request_id)

    # Check they're the same access request
    assert ar == get_ar

    assert ar.delete()


@pytest.mark.integration
def test_create_invalid_access_request(integration_client, example_model):
    metadata = {}

    with pytest.raises(BailoException):
        AccessRequest.create(
            client=integration_client,
            model_id=example_model.model_id,
            schema_id="minimal-access-request-general-v10",
            metadata=metadata,
        )
