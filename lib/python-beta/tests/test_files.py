from __future__ import annotations

from io import BytesIO

import pytest
from bailo import Model


@pytest.mark.integration
def test_file_upload(integration_client, example_model: Model):
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
