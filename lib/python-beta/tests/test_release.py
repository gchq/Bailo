from __future__ import annotations

from io import BufferedReader, BufferedWriter, BytesIO

import pytest
from bailo import Client, Model, Release
from bailo.core.enums import SchemaKind
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
    [("1.0.0", "1.0", "test", [], [], False, True)],
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
