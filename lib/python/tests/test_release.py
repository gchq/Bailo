from __future__ import annotations

import pytest
from bailo import Client, Release
from bailo.core.exceptions import BailoException
from semantic_version import Version


def test_release():
    client = Client("https://example.com")

    release = Release(
        client=client,
        model_id="test",
        version="100.10.12",
        model_card_version=1,
        notes="lgtm",
    )

    assert isinstance(release, Release)


@pytest.mark.integration
@pytest.mark.parametrize(
    ("version", "model_card_version", "notes", "files", "images", "minor", "draft"),
    [
        ("1.0.0", 1, "test", [], [], False, True),
        ("1.0.1", 1, "test", [], [], True, False),
    ],
)
def test_create_get_from_version_update_and_delete_release(
    version: Version | str,
    model_card_version: int,
    notes: str,
    files: list[str],
    images: list[str],
    minor: bool,
    draft: bool,
    integration_client,
    example_model,
):
    # Create release
    release = Release.create(
        client=integration_client,
        model_id=example_model.model_id,
        version=version,
        model_card_version=model_card_version,
        notes=notes,
        files=files,
        images=images,
        minor=minor,
        draft=draft,
    )
    assert isinstance(release, Release)

    # Check that a release can be changed
    release.notes = "testing-1234"
    release.update()

    get_release = Release.from_version(integration_client, example_model.model_id, version)

    assert get_release.notes == "testing-1234"
    # Check the release can be retrieved
    assert release == get_release

    # Check that the release is deleted
    assert release.delete()


@pytest.mark.integration
def test_nonexistent_file_ids(integration_client, example_model):
    with pytest.raises(BailoException):
        release = Release.create(
            client=integration_client,
            model_id=example_model.model_id,
            version="1.0.2",
            model_card_version=1,
            notes="test",
            files=["67cec5b458a69d6ad6d33c8d", "67cec5b458a69d6ad6d33c8d"],
            minor=False,
            draft=True,
        )


@pytest.mark.integration
def test_incorrect_format_file_ids(integration_client, example_model):
    with pytest.raises(BailoException):
        release = Release.create(
            client=integration_client,
            model_id=example_model.model_id,
            version="1.0.2",
            model_card_version=1,
            notes="test",
            files=["test-id"],
            minor=False,
            draft=True,
        )


@pytest.mark.integration
def test_create_two_release_with_same_semver(integration_client, example_model):
    Release.create(
        client=integration_client,
        model_id=example_model.model_id,
        version="1.1.0",
        model_card_version=1,
        notes="test",
    )
    with pytest.raises(BailoException):
        Release.create(
            client=integration_client,
            model_id=example_model.model_id,
            version="1.1.0",
            model_card_version=1,
            notes="test",
        )


@pytest.mark.integration
def test_retrieve_release_with_v_in_version(integration_client, example_model):
    example_model.create_release(version="v2.0.0", notes=" ")
    release = Release.from_version(client=integration_client, model_id=example_model.model_id, version="v2.0.0")

    assert str(release.version) == "2.0.0"
