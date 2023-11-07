from __future__ import annotations

from bailo import Client, Release
from semantic_version import Version


def test_release_version():
    client = Client("https://example.com")

    release = Release(client, 'test_id', '1.0.0', 1, "notes", [], [], draft=True)

    assert type(release.version) == Version
