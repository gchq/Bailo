from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path

import pytest

# isort: split

from bailo.core.exceptions import BailoException
from bailo.helper.model import Model


@pytest.mark.integration
def test_file_upload(example_model: Model):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")

    with file as file:
        example_release.upload("test", file)

    download_file = example_release.download("test", write=False)

    # Check that file uploaded has the same contents as the one downloaded
    assert download_file.content == byte_obj


@pytest.mark.integration
def test_file_upload_from_disk_large(example_model: Model, test_path_large: str):
    example_release = example_model.create_release("0.1.0", "test")

    example_release.upload(test_path_large)
    download_file = example_release.download("test.pth", write=False)

    assert download_file.status_code == 200


@pytest.mark.integration
def test_file_download_all(example_model: Model, tmp_path: Path):
    print(type(tmp_path))

    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")
    filenames = ["test.json", "test2.txt"]

    for filename in filenames:
        example_release.upload(filename, file)
        file.seek(0)

    downloads_path = tmp_path / "downloads"
    downloads_path.mkdir()
    example_release.download_all(path=str(downloads_path.absolute()))

    assert set(os.listdir(downloads_path)).issubset(filenames)


@pytest.mark.integration
def test_file_download_filter(example_model: Model, tmp_path: Path):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")
    filenames = ["test.json", "test2.txt", "to_exclude.txt"]

    for filename in filenames:
        example_release.upload(filename, file)
        file.seek(0)

    downloads_path = tmp_path / "downloads"
    downloads_path.mkdir()
    example_release.download_all(path=str(downloads_path.absolute()), include=["*.txt"], exclude=["to_exclude.txt"])

    assert os.listdir(downloads_path) == ["test2.txt"]


@pytest.mark.integration
def test_file_download_all_no_files(example_model: Model):
    example_release = example_model.create_release("0.1.0", "test")

    with pytest.raises(BailoException):
        example_release.download_all()


@pytest.mark.integration
def test_source_target_does_not_exist(example_model: Model):
    example_release = example_model.create_release("0.1.0", "test")
    with pytest.raises(BailoException):
        example_release.download("non_existant_model")


@pytest.mark.integration
def test_file_delete(example_model: Model):
    byte_obj = b"Test Binary"
    file = BytesIO(byte_obj)

    example_release = example_model.create_release("0.1.0", "test")

    with file as file:
        example_release.upload("test", file)

    original_files = example_model.client.get_files(example_model.model_id).copy()
    original_file_id = original_files["files"][0]["id"]

    delete_file_response = example_model.client.delete_file(example_model.model_id, original_file_id)

    # assert deletion was successful
    assert delete_file_response == {"message": "Successfully removed file."}

    new_files = example_model.client.get_files(example_model.model_id).copy()
    diff_files = [x for x in original_files["files"] if x not in new_files["files"]]

    # assert the specific file is no longer accessible
    assert len(diff_files) == 1 and diff_files[0]["id"] == original_file_id
