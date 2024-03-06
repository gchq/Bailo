from __future__ import annotations

from io import BytesIO

import pytest
from bailo.core.exceptions import BailoException


@pytest.mark.integration
def test_file_upload(example_model):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")

    with file as file:
        example_release.upload("test", file)

    download_file = example_release.download("test")

    # Check that file uploaded has the same contents as the one downloaded
    assert download_file.content == byte_obj


@pytest.mark.integration
def test_source_target_doesnt_exist(example_model):
    example_release = example_model.create_release("0.1.0", "test")
    with pytest.raises(BailoException):
        example_release.download("non_existant_model")
