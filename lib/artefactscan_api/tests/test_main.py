"""Test for the main.py file."""

from __future__ import annotations

import threading
import time
from functools import lru_cache
from pathlib import Path
from typing import Any
from unittest.mock import Mock, patch

import modelscan
import pytest
from fastapi.testclient import TestClient

# isort: split

from bailo_artefactscan_api.config import Settings
from bailo_artefactscan_api.main import app, get_settings

client = TestClient(app)


@lru_cache
def get_settings_override():
    return Settings()


app.dependency_overrides[get_settings] = get_settings_override


EMPTY_CONTENTS = rb""
EMPTY_FILE_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
H5_MIME_TYPE = "application/x-hdf5"
TXT_MIME_TYPE = "text/plain"
STREAM_MIME_TYPE = "application/octet-stream"


def test_lifespan_does_not_redownload_when_db_exists(mocker, tmp_path: Path):
    mocker.patch("bailo_artefactscan_api.trivy.get_settings").return_value.DB_DIR = str(tmp_path)
    (tmp_path / "metadata.json").write_text("{}")
    download = mocker.patch("bailo_artefactscan_api.trivy.download_database")

    with TestClient(app):
        pass

    download.assert_not_called()


def test_shutdown_waits_for_db_lock(mocker):
    lock = mocker.patch("bailo_artefactscan_api.trivy._DB_LOCK")
    rm = mocker.patch("shutil.rmtree")

    with TestClient(app):
        pass

    lock.__enter__.assert_called()
    rm.assert_called()


def test_info():
    response = client.get("/info")

    assert response.status_code == 200
    assert response.json() == {
        "apiName": get_settings_override().app_name,
        "apiVersion": get_settings_override().app_version,
        "modelscanScannerName": "modelscan",
        "modelscanVersion": modelscan.__version__,
        "trivyScannerName": "trivy",
        "trivyVersion": "unknown",
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


@patch("bailo_artefactscan_api.main.is_valid_pickle")
@patch("modelscan.modelscan.ModelScan.scan")
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


def test_update_blocks_until_scan_finishes(mocker):
    enter = threading.Event()
    exit = threading.Event()

    class FakeLock:
        def __enter__(self):
            enter.set()
            time.sleep(0.2)

        def __exit__(self, *a):
            exit.set()

    mocker.patch("bailo_artefactscan_api.trivy._DB_LOCK", FakeLock())
    mocker.patch("bailo_artefactscan_api.trivy.create_sbom")
    mocker.patch("bailo_artefactscan_api.trivy.scan_sbom", return_value={})
    mocker.patch("bailo_artefactscan_api.trivy.get_next_update", return_value=None)
    mocker.patch("tarfile.is_tarfile", return_value=False)

    files = {"in_file": (EMPTY_FILE_HASH, EMPTY_CONTENTS, STREAM_MIME_TYPE)}
    client.post("/scan/image", files=files)

    assert enter.is_set()
    assert exit.is_set()
