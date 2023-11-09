from __future__ import annotations

from bailo import Client, Release
from bailo.core.enums import SchemaKind
from semantic_version import Version


def test_get_release():
    client = Client("http://localhost:8080")
    release = Release.retrieve(client, "bosh-ggcpfp", "1.1.27688")
    print(release.reviews)

def test_publish_release():
    client = Client("http://localhost:8080")
    release = Release(
        client=client,
        model_id="bosh-ggcpfp",
        version="100.21.12123326",
        model_card_version=1,
        notes="lgtm",
        files=[],
        images=[]
    )
    res = release.publish()

    assert not 'error' in res


def test_get_latest_release():
    client = Client("http://localhost:8080")
    release = Release.retrieve_latest(client, "bosh-ggcpfp")
