from __future__ import annotations

from io import BytesIO

import pytest
from bailo.core.exceptions import ResponseException


@pytest.mark.integration
def test_file_upload(example_model):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")

    with file as file:
        file_id = example_release.upload("test", file)

    download_file = BytesIO()
    example_release.download(file_id, download_file)

    # Check that file uploaded has the same contents as the one downloaded
    download_file.seek(0)
    assert download_file.read() == byte_obj


@pytest.mark.integration
def test_source_target_doesnt_exist(example_model):
    download_file = BytesIO()
    example_release = example_model.create_release("0.1.0", "test")
    with pytest.raises(ResponseException):
        example_release.download("non_existant_model", download_file)
