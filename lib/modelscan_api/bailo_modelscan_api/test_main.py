"""Test for the main.py file.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from unittest.mock import Mock, patch

import modelscan
from fastapi.testclient import TestClient

from .config import Settings
from .dependencies import parse_path
from .main import app, get_settings

client = TestClient(app)


@lru_cache
def get_settings_override():
    return Settings(download_dir=".")


app.dependency_overrides[get_settings] = get_settings_override


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
def test_scan_file(mock_scan: Mock):
    mock_scan.return_value = {}
    files = {"in_file": ("foo.h5", rb"", "application/x-hdf5")}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 200
    mock_scan.assert_called_once()


@patch("modelscan.modelscan.ModelScan.scan")
def test_scan_file_escape_path(mock_scan: Mock):
    mock_scan.return_value = {}
    files = {"in_file": ("../foo.bar", rb"", "application/x-hdf5")}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 200
    mock_scan.assert_called_once()


def test_scan_file_escape_path_error():
    files = {"in_file": ("..", rb"", "text/plain")}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 500
    assert response.json() == {"detail": "An error occurred while processing the uploaded file's name."}


@patch("modelscan.modelscan.ModelScan.scan")
def test_scan_file_exception(mock_scan: Mock):
    mock_scan.side_effect = Exception("Mocked error!")
    files = {"in_file": ("foo.h5", rb"", "application/x-hdf5")}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 500
    assert response.json() == {"detail": "An error occurred: Mocked error!"}
    mock_scan.assert_called_once()

    # Manually cleanup as FastAPI won't trigger background_tasks on Exception due to using TestClient.
    Path.unlink(Path.joinpath(parse_path(get_settings().download_dir), "foo.h5"), missing_ok=True)


def test_scan_file_filename_missing():
    files = {"in_file": (" ", rb"", "application/x-hdf5")}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 500
    assert response.json() == {"detail": "An error occurred while extracting the uploaded file's name."}
