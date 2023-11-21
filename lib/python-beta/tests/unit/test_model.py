from __future__ import annotations

from bailo.core import Client, ModelVisibility
from bailo.helper import Model


def test_model():
    client = Client("https://example.com")
    visibility = ModelVisibility.Public

    model = Model(
        client=client,
        name="test",
        description="test",
        visibility=visibility,
    )

    assert isinstance(model, Model)
