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


@pytest.mark.integration
@pytest.mark.parametrize(
    ("name", "schema_id", "created_by", "end_date"),
    [("test", "minimal-access-request-general-v10-beta", "user", "1970-01-01")],
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
            schema_id="minimal-access-request-general-v10-beta",
            metadata=metadata,
        )
