from __future__ import annotations

import hashlib
import pathlib
import tarfile
from http import HTTPStatus
from io import BytesIO
from subprocess import CalledProcessError
from typing import Any
from unittest.mock import Mock, patch

import pytest
from fastapi import BackgroundTasks, HTTPException, UploadFile

# isort: split

import bailo_artefactscan_api.trivy as trivy

EMPTY_CONTENTS = b""
EMPTY_DIGEST = hashlib.sha256(EMPTY_CONTENTS).hexdigest()


@pytest.mark.parametrize(
    ("file_name", "file_content"),
    [("deadbeef", EMPTY_CONTENTS)],
)
def test_scan_wrong_digest(file_name: str, file_content: Any):
    with pytest.raises(HTTPException) as exception:
        trivy.scan(UploadFile(BytesIO(file_content), filename=file_name), BackgroundTasks([]))

    assert exception.value.status_code == HTTPStatus.BAD_REQUEST.value
    assert exception.value.detail == f"Uploaded blob {file_name} did not match expected digest"


@patch("subprocess.Popen")
def test_unable_to_create_sbom(mock_run: Mock):
    mock_run.side_effect = CalledProcessError(1, "trivy")
    with pytest.raises(HTTPException) as exception:
        trivy.create_sbom("tempfile", "deadbeef")

    assert exception.value.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value
    assert exception.value.detail == "Trivy failed creating sbom"


@patch("builtins.open")
def test_unable_to_find_sbom(mock_open: Mock):
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
