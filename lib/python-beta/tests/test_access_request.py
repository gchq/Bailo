from __future__ import annotations

import pytest
from bailo.core.client import Client
from bailo.helper.access_request import AccessRequest


def test_access_request():
    client = Client("https://example.com")

    access_request = AccessRequest(client=client,
                                   name="test",
                                   model_id="test_id",
                                   created_by="user",
                                   schema_id="test_id",
                                   access_request_id="example"
                                )

    assert isinstance(access_request, AccessRequest)

@pytest.mark.integration
@pytest.mark.parametrize(
    ("name","schema_id","created_by", "end_date"),
    [
        ("test","minimal-access-request-general-v10-beta", "user", "1970-01-01")
    ]
)
def test_create_get_from_version_update_and_delete_access_request(name, schema_id, created_by, end_date, integration_client, example_model):
    # Create access request
    ar = AccessRequest.create(
        client=integration_client,
        name=name,
        model_id=example_model.model_id,
        schema_id=schema_id,
        created_by=created_by,
        end_date=end_date
    )

    # Get access request
    get_ar = AccessRequest.from_id(integration_client, example_model.model_id, ar.access_request_id)

    # Check they're the same access request
    assert ar == get_ar

    ar.delete()
