"""Test for the main.py file."""

from __future__ import annotations

from functools import lru_cache
from typing import Any
from unittest.mock import Mock, patch

import modelscan
import pytest
from fastapi.testclient import TestClient

# isort: split

from bailo_artefactscan_api import trivy
from bailo_artefactscan_api.config import Settings
from bailo_artefactscan_api.main import app, get_settings

client = TestClient(app)


@lru_cache
def get_settings_override():
    return Settings()


app.dependency_overrides[get_settings] = get_settings_override


EMPTY_CONTENTS = rb""
H5_MIME_TYPE = "application/x-hdf5"
TXT_MIME_TYPE = "text/plain"


def test_info():
    response = client.get("/info")

    assert response.status_code == 200
    assert response.json() == {
        "apiName": get_settings_override().app_name,
        "apiVersion": get_settings_override().app_version,
        "scannerName": artefactscan.__name__,
        "artefactscanVersion": artefactscan.__version__,
    }


@patch("artefactscan.artefactscan.ArtefactScan.scan")
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


@patch("artefactscan.artefactscan.ArtefactScan.scan")
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


@patch("bailo_artefactscan_api.main.is_valid_pickle")
@patch("artefactscan.artefactscan.ArtefactScan.scan")
@pytest.mark.parametrize(
    ("file_name", "file_content", "file_mime_type"),
    [
        ("license.dat", "# License\nExample license.", TXT_MIME_TYPE),
    ],
)
def test_scan_invalid_pickle_file(
    mock_scan: Mock, mock_is_valid_pickle: Mock, file_name: str, file_content: Any, file_mime_type: str
):
    mock_scan.return_value = {}
    mock_is_valid_pickle.return_value = False
    files = {"in_file": (file_name, file_content, file_mime_type)}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 200
    assert ".dat" not in str(response.content)
    mock_is_valid_pickle.assert_called_once()
    mock_scan.assert_called_once()
