#   ---------------------------------------------------------------------------------
#   Copyright (c) Microsoft Corporation. All rights reserved.
#   Licensed under the MIT License. See LICENSE in project root for information.
#   ---------------------------------------------------------------------------------
"""This is a sample python file for testing functions from the source code."""
from __future__ import annotations

from bailo import BailoClient
from bailo.enums import ModelVisibility

mock_result = {"success": True}


def test_create_model(requests_mock):
    requests_mock.post("https://example.com/api/v2/models", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.create_model(
        name="test", description="test", visibility=ModelVisibility.Public
    )

    assert result == {"success": True}
