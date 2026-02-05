from __future__ import annotations

import hashlib
import pathlib
import tarfile
from http import HTTPStatus
from io import BytesIO
from typing import Any
from unittest.mock import Mock, patch

import pytest
from bailo_modelscan_api import trivy
from bailo_modelscan_api.main import app
from fastapi import BackgroundTasks, HTTPException, UploadFile
from fastapi.testclient import TestClient

client = TestClient(app)

EMPTY_CONTENTS = b""
EMPTY_DIGEST = hashlib.sha256(EMPTY_CONTENTS).hexdigest()
TAR_MIME_TYPE = "application/x-tar"


@patch("bailo_modelscan_api.trivy.scan")
@pytest.mark.parametrize(
    ("file_name", "file_content", "file_mime_type"),
    [(EMPTY_DIGEST, EMPTY_CONTENTS, TAR_MIME_TYPE)],
)
def test_scan_blob(mock_scan: Mock, file_name: str, file_content: Any, file_mime_type: str):
    mock_scan.return_value = {}
    files = {"in_file": (file_name, file_content, file_mime_type)}

    response = client.post("/scan/image", files=files)
    assert response.status_code == HTTPStatus.OK.value
    mock_scan.assert_called_once()


@pytest.mark.parametrize(
    ("file_name", "file_content"),
    [("deadbeef", EMPTY_CONTENTS)],
)
def test_scan_wrong_digest(file_name: str, file_content: Any):
    with pytest.raises(HTTPException) as exception:
        trivy.scan(UploadFile(BytesIO(file_content), filename=file_name), BackgroundTasks([]))

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == f"Blob {file_name} has been modified"


@patch("subprocess.Popen")
def test_unable_to_create_sbom(mock_run: Mock):
    process_mock = Mock()
    attrs = {"communicate.return_value": ("output", "error")}
    process_mock.configure_mock(**attrs)
    mock_run.return_value = process_mock
    with pytest.raises(HTTPException) as exception:
        trivy.create_sbom("tempfile", "deadbeef")

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "Trivy failed creating sbom"


@patch("builtins.open")
def test_unable_to_scan_sbom(mock_open: Mock):
    mock_open.side_effect = FileNotFoundError
    with pytest.raises(HTTPException) as exception:
        trivy.scan_sbom("deadbeef")

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "There was a problem with retrieving the SBOM"


@patch("tarfile.is_tarfile")
@patch("tarfile.open")
def test_unable_to_extract_tar_file(
    mock_tarfile_istarfile: Mock,
    mock_tarfile_open: Mock,
):
    mock_tarfile_istarfile.return_value = True
    mock_tarfile_open.side_effect = tarfile.ReadError

    with patch.object(pathlib.Path, "is_file") as mock_isfile:
        mock_isfile.return_value = False
        with pytest.raises(HTTPException) as exception:
            trivy.scan(UploadFile(BytesIO(EMPTY_CONTENTS), filename=EMPTY_DIGEST), BackgroundTasks([]))

    assert exception.value.detail.startswith("An error occurred while extracting image layer:")
