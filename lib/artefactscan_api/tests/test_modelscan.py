from __future__ import annotations

import pickle
from pathlib import Path

# isort: split

from bailo_artefactscan_api.config import Settings
from bailo_artefactscan_api.modelscan import extract_supported_file_types, is_valid_pickle


def test_extract_supported_file_types_all_sources():
    settings = {
        "supported_zip_extensions": [".zip", ".tar"],
        "scanners": {
            "scanner_a": {"supported_extensions": [".pkl", ".pickle"]},
            "scanner_b": {"supported_extensions": [".joblib"]},
        },
        "middlewares": {
            "middleware_a": {
                "formats": {
                    "format1": [".onnx", ".pt"],
                    "format2": [".h5"],
                }
            }
        },
    }

    result = extract_supported_file_types(settings)

    assert result == {
        ".zip",
        ".tar",
        ".pkl",
        ".pickle",
        ".joblib",
        ".onnx",
        ".pt",
        ".h5",
    }


def test_extract_supported_file_types_missing_sections():
    settings = {}

    result = extract_supported_file_types(settings)

    assert result == set()


def test_extract_supported_file_types_deduplicates():
    settings = {
        "supported_zip_extensions": [".zip"],
        "scanners": {"scanner_a": {"supported_extensions": [".zip", ".pkl"]}},
        "middlewares": {"middleware_a": {"formats": {"format1": [".pkl", ".pt"]}}},
    }

    result = extract_supported_file_types(settings)

    assert result == {".zip", ".pkl", ".pt"}


def test_is_valid_pickle_true(tmp_path: Path):
    file_path = tmp_path / "valid.pkl"

    with open(file_path, "wb") as f:
        pickle.dump({"a": 1}, f)

    assert is_valid_pickle(file_path) is True


def test_is_valid_pickle_false_for_empty_file(tmp_path: Path):
    file_path = tmp_path / "empty.pkl"
    file_path.write_bytes(b"")

    assert is_valid_pickle(file_path) is False


def test_is_valid_pickle_false_for_invalid_bytes(tmp_path: Path):
    file_path = tmp_path / "invalid.pkl"
    file_path.write_bytes(b"not a pickle")

    assert is_valid_pickle(file_path) is False


def test_is_valid_pickle_respects_max_bytes(tmp_path: Path):
    file_path = tmp_path / "partial.pkl"

    data = pickle.dumps({"key": "value"})
    file_path.write_bytes(data)

    # Read only a small portion which should break pickle parsing
    result = is_valid_pickle(file_path, max_bytes=5)

    assert result is False
