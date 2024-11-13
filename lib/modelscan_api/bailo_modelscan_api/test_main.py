"""Test for the main.py file.
"""

from pathlib import Path
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from .dependencies import parse_path
from .main import app, get_settings

client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@patch("modelscan.modelscan.ModelScan.scan")
def test_scan_file(mock_scan: Mock):
    mock_scan.return_value = {}
    files = {"in_file": ("foo.h5", rb"", "application/x-hdf5")}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 200
    mock_scan.assert_called_once()


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
