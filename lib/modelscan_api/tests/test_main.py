"""Test for the main.py file."""

from __future__ import annotations

from functools import lru_cache
from typing import Any
from unittest.mock import Mock, patch

import modelscan
import pytest
from fastapi.testclient import TestClient

# isort: split

from bailo_modelscan_api.config import Settings
from bailo_modelscan_api.main import app, get_settings

client = TestClient(app)


@lru_cache
def get_settings_override():
    return Settings()


app.dependency_overrides[get_settings] = get_settings_override


EMPTY_CONTENTS = rb""
H5_MIME_TYPE = "application/x-hdf5"


def test_info():
    response = client.get("/info")

    assert response.status_code == 200
    assert response.json() == {
        "apiName": get_settings_override().app_name,
        "apiVersion": get_settings_override().app_version,
        "scannerName": modelscan.__name__,
        "modelscanVersion": modelscan.__version__,
    }


@patch("modelscan.modelscan.ModelScan.scan")
@pytest.mark.parametrize(
    ("file_name", "file_content", "file_mime_type"),
    [
        ("foo.h5", EMPTY_CONTENTS, H5_MIME_TYPE),
        ("../foo.h5", EMPTY_CONTENTS, H5_MIME_TYPE),
        ("-", EMPTY_CONTENTS, H5_MIME_TYPE),
    ],
)
def test_scan_file(mock_scan: Mock, file_name: str, file_content: Any, file_mime_type: str):
    mock_scan.return_value = {}
    files = {"in_file": (file_name, file_content, file_mime_type)}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 200
    mock_scan.assert_called_once()


@patch("modelscan.modelscan.ModelScan.scan")
@pytest.mark.parametrize(
    ("file_name", "file_content", "file_mime_type"),
    [("foo.h5", EMPTY_CONTENTS, H5_MIME_TYPE)],
)
def test_scan_file_exception(mock_scan: Mock, file_name: str, file_content: Any, file_mime_type: str):
    mock_scan.side_effect = Exception("Mocked error!")
    files = {"in_file": (file_name, file_content, file_mime_type)}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 500
    assert response.json() == {"detail": "An error occurred: Mocked error!"}
    mock_scan.assert_called_once()
