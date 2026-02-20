from http import HTTPStatus
from typing import Any

# Example response generated from https://github.com/protectai/modelscan/blob/main/notebooks/keras_fashion_mnist.ipynb
SCAN_FILE_RESPONSES: dict[int | str, dict[str, Any]] = {
    HTTPStatus.OK.value: {
        "description": "modelscan returned results",
        "content": {
            "application/json": {
                "examples": {
                    "Normal": {
                        "value": {
                            "summary": {
                                "total_issues_by_severity": {
                                    "LOW": 0,
                                    "MEDIUM": 0,
                                    "HIGH": 0,
                                    "CRITICAL": 0,
                                },
                                "total_issues": 0,
                                "input_path": "/foo/bar/safe_model.pkl",
                                "absolute_path": "/foo/bar",
                                "modelscan_version": "0.8.1",
                                "timestamp": "2024-11-19T12:00:00.000000",
                                "scanned": {
                                    "total_scanned": 1,
                                    "scanned_files": ["safe_model.pkl"],
                                },
                                "skipped": {
                                    "total_skipped": 0,
                                    "skipped_files": [],
                                },
                            },
                            "issues": [],
                            "errors": [],
                        }
                    },
                    "Issue": {
                        "value": {
                            "summary": {
                                "total_issues_by_severity": {
                                    "LOW": 0,
                                    "MEDIUM": 1,
                                    "HIGH": 0,
                                    "CRITICAL": 0,
                                },
                                "total_issues": 1,
                                "input_path": "/foo/bar/unsafe_model.h5",
                                "absolute_path": "/foo/bar",
                                "modelscan_version": "0.8.1",
                                "timestamp": "2024-11-19T12:00:00.000000",
                                "scanned": {
                                    "total_scanned": 1,
                                    "scanned_files": ["unsafe_model.h5"],
                                },
                                "skipped": {
                                    "total_skipped": 0,
                                    "skipped_files": [],
                                },
                            },
                            "issues": [
                                {
                                    "description": "Use of unsafe operator 'Lambda' from module 'Keras'",
                                    "operator": "Lambda",
                                    "module": "Keras",
                                    "source": "unsafe_model.h5",
                                    "scanner": "modelscan.scanners.H5LambdaDetectScan",
                                    "severity": "MEDIUM",
                                }
                            ],
                            "errors": [],
                        }
                    },
                    "Skipped": {
                        "value": {
                            "errors": [],
                            "issues": [],
                            "summary": {
                                "input_path": "/foo/bar/empty.txt",
                                "absolute_path": "/foo/bar",
                                "modelscan_version": "0.8.1",
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
                                "timestamp": "2024-11-19T12:00:00.000000",
                                "total_issues": 0,
                                "total_issues_by_severity": {
                                    "CRITICAL": 0,
                                    "HIGH": 0,
                                    "LOW": 0,
                                    "MEDIUM": 0,
                                },
                            },
                        }
                    },
                    "Error": {
                        "value": {
                            "summary": {
                                "total_issues_by_severity": {
                                    "LOW": 0,
                                    "MEDIUM": 0,
                                    "HIGH": 0,
                                    "CRITICAL": 0,
                                },
                                "total_issues": 0,
                                "input_path": "/foo/bar/null.h5",
                                "absolute_path": "/foo/bar",
                                "modelscan_version": "0.8.1",
                                "timestamp": "2024-11-19T12:00:00.000000",
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
                        }
                    },
                }
            }
        },
    },
    HTTPStatus.INTERNAL_SERVER_ERROR.value: {
        "description": "The server could not complete the request",
        "content": {
            "application/json": {
                "example": {
                    "detail": "The following error was raised during a pytorch scan:\nInvalid magic number for file: /tmp/tmpzlugzlrh.pt"
                }
            }
        },
    },
}
