from __future__ import annotations

from io import BytesIO

import pytest
from bailo.core.exceptions import BailoException
import os


@pytest.mark.integration
def test_file_upload(example_model):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")

    with file as file:
        example_release.upload("test", file)

    download_file = example_release.download("test", write=False)

    # Check that file uploaded has the same contents as the one downloaded
    assert download_file.content == byte_obj


@pytest.mark.integration
def test_file_download_all(example_model, tmpdir):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")
    filenames = ["test.json", "test2.txt"]

    for filename in filenames:
        example_release.upload(filename, file)
        file.seek(0)

    downloads_path = tmpdir.mkdir("downloads")
    example_release.download_all(path=downloads_path)

    assert set(os.listdir(downloads_path)).issubset(filenames)


@pytest.mark.integration
def test_file_download_filter(example_model, tmpdir):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")
    filenames = ["test.json", "test2.txt", "to_exclude.txt"]

    for filename in filenames:
        example_release.upload(filename, file)
        file.seek(0)

    downloads_path = tmpdir.mkdir("downloads")
    example_release.download_all(path=downloads_path, include=["*.txt"], exclude=["to_exclude.txt"])

    assert os.listdir(downloads_path) == ["test2.txt"]


@pytest.mark.integration
def test_file_download_all_no_files(example_model):
    example_release = example_model.create_release("0.1.0", "test")

    with pytest.raises(BailoException):
        example_release.download_all()


@pytest.mark.integration
def test_source_target_doesnt_exist(example_model):
    example_release = example_model.create_release("0.1.0", "test")
    with pytest.raises(BailoException):
        example_release.download("non_existant_model")
