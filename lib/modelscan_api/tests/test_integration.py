"""Integration tests for working with ModelScan.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any
from unittest.mock import ANY

from fastapi.testclient import TestClient
import modelscan
import pytest

from bailo_modelscan_api.config import Settings
from bailo_modelscan_api.main import app, get_settings

client = TestClient(app)


@lru_cache
def get_settings_override():
    return Settings(download_dir=".")


app.dependency_overrides[get_settings] = get_settings_override


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
                    "absolute_path": str(Path().cwd().absolute()),
                    "input_path": str(Path().cwd().absolute().joinpath("empty.txt")),
                    "modelscan_version": modelscan.__version__,
                    "scanned": {"total_scanned": 0},
                    "skipped": {
                        "skipped_files": [
                            {
                                "category": "SCAN_NOT_SUPPORTED",
                                "description": "Model Scan did not scan file",
                                "source": "empty.txt",
                            }
                        ],
                        "total_skipped": 1,
                    },
                    "timestamp": ANY,
                    "total_issues": 0,
                    "total_issues_by_severity": {"CRITICAL": 0, "HIGH": 0, "LOW": 0, "MEDIUM": 0},
                },
            },
        ),
        (
            "null.h5",
            rb"",
            H5_MIME_TYPE,
            {
                "summary": {
                    "total_issues_by_severity": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
                    "total_issues": 0,
                    "input_path": str(Path().cwd().absolute().joinpath("null.h5")),
                    "absolute_path": str(Path().cwd().absolute()),
                    "modelscan_version": modelscan.__version__,
                    "timestamp": ANY,
                    "scanned": {"total_scanned": 0},
                    "skipped": {
                        "total_skipped": 1,
                        "skipped_files": [
                            {
                                "category": "SCAN_NOT_SUPPORTED",
                                "description": "Model Scan did not scan file",
                                "source": "null.h5",
                            }
                        ],
                    },
                },
                "issues": [],
                "errors": [
                    {
                        "category": "MODEL_SCAN",
                        "description": "Unable to synchronously open file (file signature not found)",
                        "source": "null.h5",
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
                    "total_issues_by_severity": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
                    "total_issues": 0,
                    "input_path": str(Path().cwd().absolute().joinpath("safe.pkl")),
                    "absolute_path": str(Path().cwd().absolute()),
                    "modelscan_version": modelscan.__version__,
                    "timestamp": ANY,
                    "scanned": {"total_scanned": 1, "scanned_files": ["safe.pkl"]},
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
                    "total_issues_by_severity": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 1},
                    "total_issues": 1,
                    "input_path": str(Path().cwd().absolute().joinpath("unsafe.pkl")),
                    "absolute_path": str(Path().cwd().absolute()),
                    "modelscan_version": modelscan.__version__,
                    "timestamp": ANY,
                    "scanned": {"total_scanned": 1, "scanned_files": ["unsafe.pkl"]},
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
                        "source": "unsafe.pkl",
                    },
                ],
                "errors": [],
            },
        ),
    ],
)
def test_scan_file(file_name: str, file_content: Path | bytes, file_mime_type: str, expected_response: dict) -> None:
    # allow passing in a Path to read the file's contents for specific data types
    if isinstance(file_content, Path):
        with open(file_content, "rb") as f:
            file_content = f.read()

    files = {"in_file": (file_name, file_content, file_mime_type)}

    response = client.post("/scan/file", files=files)

    assert response.status_code == 200
    assert response.json() == expected_response
