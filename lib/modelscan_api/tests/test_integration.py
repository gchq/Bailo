"""Integration tests for working with ModelScan."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any
from unittest.mock import ANY

import modelscan
import pytest
from content_size_limit_asgi import ContentSizeLimitMiddleware
from fastapi.testclient import TestClient

# isort: split

from bailo_modelscan_api.config import Settings
from bailo_modelscan_api.main import CustomMiddlewareHTTPExceptionWrapper, app, get_settings


@lru_cache
def get_settings_override():
    return Settings(maximum_filesize=1000)


app.dependency_overrides[get_settings] = get_settings_override
app.user_middleware.clear()
app.add_middleware(
    ContentSizeLimitMiddleware,
    max_content_size=get_settings_override().maximum_filesize,
    exception_cls=CustomMiddlewareHTTPExceptionWrapper,
)
client = TestClient(app)


BIG_CONTENTS = b"\0" * 1024
H5_MIME_TYPE = "application/x-hdf5"
OCTET_STREAM_TYPE = "application/octet-stream"


@pytest.mark.integration
@pytest.mark.parametrize(
    ("file_name", "file_content", "file_mime_type", "expected_response"),
    [
        (
            "empty.txt",
            rb"",
            "text/plain",
            {
                "errors": [],
                "issues": [],
                "summary": {
                    "absolute_path": ANY,
                    "input_path": ANY,
                    "modelscan_version": modelscan.__version__,
                    "scanned": {"total_scanned": 0},
                    "skipped": {
                        "skipped_files": [
                            {
                                "category": "SCAN_NOT_SUPPORTED",
                                "description": "Model Scan did not scan file",
                                "source": ANY,
                            }
                        ],
                        "total_skipped": 1,
                    },
                    "timestamp": ANY,
                    "total_issues": 0,
                    "total_issues_by_severity": {
                        "CRITICAL": 0,
                        "HIGH": 0,
                        "LOW": 0,
                        "MEDIUM": 0,
                    },
                },
            },
        ),
        (
            "null.h5",
            rb"",
            H5_MIME_TYPE,
            {
                "summary": {
                    "total_issues_by_severity": {
                        "LOW": 0,
                        "MEDIUM": 0,
                        "HIGH": 0,
                        "CRITICAL": 0,
                    },
                    "total_issues": 0,
                    "input_path": ANY,
                    "absolute_path": ANY,
                    "modelscan_version": modelscan.__version__,
                    "timestamp": ANY,
                    "scanned": {"total_scanned": 0},
                    "skipped": {
                        "total_skipped": 1,
                        "skipped_files": [
                            {
                                "category": "SCAN_NOT_SUPPORTED",
                                "description": "Model Scan did not scan file",
                                "source": ANY,
                            }
                        ],
                    },
                },
                "issues": [],
                "errors": [
                    {
                        "category": "MODEL_SCAN",
                        "description": "Unable to synchronously open file (file signature not found)",
                        "source": ANY,
                    }
                ],
            },
        ),
        (
            "safe.pkl",
            Path().cwd().joinpath("tests/test_integration/safe.pkl"),
            OCTET_STREAM_TYPE,
            {
                "summary": {
                    "total_issues_by_severity": {
                        "LOW": 0,
                        "MEDIUM": 0,
                        "HIGH": 0,
                        "CRITICAL": 0,
                    },
                    "total_issues": 0,
                    "input_path": ANY,
                    "absolute_path": ANY,
                    "modelscan_version": modelscan.__version__,
                    "timestamp": ANY,
                    "scanned": {"total_scanned": 1, "scanned_files": [ANY]},
                    "skipped": {
                        "total_skipped": 0,
                        "skipped_files": [],
                    },
                },
                "issues": [],
                "errors": [],
            },
        ),
        (
            "unsafe.pkl",
            Path().cwd().joinpath("tests/test_integration/unsafe.pkl"),
            OCTET_STREAM_TYPE,
            {
                "summary": {
                    "total_issues_by_severity": {
                        "LOW": 0,
                        "MEDIUM": 0,
                        "HIGH": 0,
                        "CRITICAL": 1,
                    },
                    "total_issues": 1,
                    "input_path": ANY,
                    "absolute_path": ANY,
                    "modelscan_version": modelscan.__version__,
                    "timestamp": ANY,
                    "scanned": {"total_scanned": 1, "scanned_files": [ANY]},
                    "skipped": {
                        "total_skipped": 0,
                        "skipped_files": [],
                    },
                },
                "issues": [
                    {
                        "description": "Use of unsafe operator 'system' from module 'posix'",
                        "module": "posix",
                        "operator": "system",
                        "scanner": "modelscan.scanners.PickleUnsafeOpScan",
                        "severity": "CRITICAL",
                        "source": ANY,
                    },
                ],
                "errors": [],
            },
        ),
    ],
)
def test_scan_file(
    file_name: str,
    file_content: Path | bytes,
    file_mime_type: str,
    expected_response: dict,
) -> None:
    # allow passing in a Path to read the file's contents for specific data types
    if isinstance(file_content, Path):
        with open(file_content, "rb") as f:
            file_content = f.read()

    files = {"in_file": (file_name, file_content, file_mime_type)}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 200
    assert response.json() == expected_response


@pytest.mark.integration
@pytest.mark.parametrize(
    ("file_name", "file_content", "file_mime_type"),
    [("foo.h5", BIG_CONTENTS, H5_MIME_TYPE)],
)
def test_scan_file_too_large(file_name: str, file_content: Any, file_mime_type: str):
    files = {"in_file": (file_name, file_content, file_mime_type)}

    response = client.post("/scan/file", files=files)
    print(response.json())

    assert response.status_code == 413
    assert response.json() == {"detail": ANY}
