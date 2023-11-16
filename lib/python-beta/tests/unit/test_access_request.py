from __future__ import annotations

from bailo import AccessRequest, Client


def test_access_request():
    client = Client("https://example.com")

    access_request = AccessRequest(client=client,
                                   name="test",
                                   model_id="test_id",
                                   created_by="user",
                                   schema_id="test_id",
                                   )

    assert isinstance(access_request, AccessRequest)
