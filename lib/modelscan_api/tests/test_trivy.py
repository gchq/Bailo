from __future__ import annotations

import datetime
import hashlib
import pathlib
import tarfile
from http import HTTPStatus
from io import BytesIO
from typing import Any, BinaryIO
from unittest.mock import Mock, patch

import pytest
from bailo_modelscan_api import trivy
from bailo_modelscan_api.main import app
from fastapi import HTTPException, UploadFile
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


def test_unable_to_create_sbom(): ...


def test_unable_to_scan_sbom(): ...


def test_unable_to_extract_tar_file(): ...
