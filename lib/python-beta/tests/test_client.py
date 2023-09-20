#   ---------------------------------------------------------------------------------
#   Copyright (c) Microsoft Corporation. All rights reserved.
#   Licensed under the MIT License. See LICENSE in project root for information.
#   ---------------------------------------------------------------------------------
"""This is a sample python file for testing functions from the source code."""
from __future__ import annotations
import json

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


def test_find_models(requests_mock):
    requests_mock.get("https://example.com/api/v2/models/search", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.find_models(
        task="Image Classification"
    )

    assert result == {"success": True}


def test_get_model(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.get_model(
        model_id="test_id"
    )

    assert result == {"success": True}


def test_update_model(requests_mock):
    requests_mock.patch("https://example.com/api/v2/model/test_id", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.update_model(
        model_id="test_id"
    )

    assert result == {"success": True}


def test_get_model_card(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/model-card/v1", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.get_model_card(
        model_id="test_id", version="v1"
    )

    assert result == {"success": True}


def test_update_model_card(requests_mock):
    requests_mock.put("https://example.com/api/v2/model/test_id/model-cards", json={"success": True})

    x = {"test" : "object"}
    y = json.dumps(x)

    client = BailoClient("https://example.com")
    result = client.update_model_card(
        model_id="test_id", metadata=y
    )

    assert result == {"success": True}


def test_model_card_from_schema(requests_mock):
    requests_mock.post("https://example.com/api/v2/model/test_id/setup/from-schema", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.model_card_from_schema(
        model_id="test_id", schema_id='test_id'
    )

    assert result == {"success": True}


def test_create_release(requests_mock):
    requests_mock.post("https://example.com/api/v2/model/test_id/releases", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.create_release(
        model_id="test_id", 
        model_card_version=1, 
        release_version='v1',
        notes='Test Note',
        files=[],
        images=[],
    )

    assert result == {"success": True}


def test_get_all_releases(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/releases", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.get_all_releases(
        model_id="test_id", 
    )

    assert result == {"success": True}


def test_get_release(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/releases/v1", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.get_release(
        model_id="test_id",
        release_version="v1",
    )

    assert result == {"success": True}


def test_delete_release(requests_mock):
    requests_mock.delete("https://example.com/api/v2/model/test_id/releases/v1", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.delete_release(
        model_id="test_id",
        release_version="v1",
    )

    assert result == {"success": True}


def test_get_files(requests_mock):
    requests_mock.get("https://example.com/api/v2/model/test_id/files", json={"success": True})

    client = BailoClient("https://example.com")
    result = client.get_files(
        model_id="test_id",
    )

    assert result == {"success": True}