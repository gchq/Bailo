from __future__ import annotations

from bailo import Client, Release
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

# implement when Model class has been created

# def test_get_release():
#     client = Client("http://localhost:8080")
#     release = Release.retrieve(client, "test-ggcpfp", "1.1.27688")
#     print(release.reviews)


# def test_get_latest_release(example_model):
#     client = Client("http://localhost:8080")
#     release = Release.retrieve_latest(client, "test-ggcpfp")
