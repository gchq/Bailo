from __future__ import annotations

import datetime
import hashlib
import pathlib
import tarfile
import tempfile
from http import HTTPStatus
from io import BytesIO
from tempfile import TemporaryFile
from typing import Any, BinaryIO
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
        trivy.scan(upload_file=UploadFile(BytesIO(file_content), filename=file_name), background_tasks=[])

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == f"Blob {file_name} has been modified"


@patch("subprocess.run")
@patch.object(pathlib.Path, "is_file")
def test_unable_to_create_sbom(mock_run: Mock, mock_path: Mock):
    mock_run.side_effect = FileNotFoundError
    mock_path.return_value = True
    with pytest.raises(HTTPException) as exception:
        trivy.create_sbom("tempfile", "deadbeef")

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "There was a problem with creating the SBOM"


@patch("builtins.open")
def test_unable_to_scan_sbom(mock_open: Mock):
    mock_open.side_effect = FileNotFoundError
    with pytest.raises(HTTPException) as exception:
        trivy.scan_sbom("deadbeef")

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "There was a problem with retrieving the SBOM"


@patch("tempfile.TemporaryDirectory")
@patch("tarfile.is_tarfile")
@patch.object(pathlib.Path, "is_file")
def test_unable_to_extract_tar_file(mock_tempdir: Mock, mock_tarfile_istarfile: Mock, mock_path: Mock):
    mock_path.return_value = False
    mock_tempdir.return_value = "/tmp/file"
    mock_tarfile_istarfile.side_effect = tarfile.ReadError

    with pytest.raises(HTTPException) as exception:
        trivy.scan(UploadFile(BytesIO(EMPTY_CONTENTS), filename=EMPTY_DIGEST), BackgroundTasks([]))

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "There was a problem with retrieving the SBOM"
