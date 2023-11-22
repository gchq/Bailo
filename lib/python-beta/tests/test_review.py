from __future__ import annotations

from bailo import Client
from bailo.core.enums import ReviewDecision, Role, SchemaKind
from bailo.helper.reviews import Review, ReviewResponse


def test_create_review():
    """ Test that a review can be created
    """
    client = Client("https://example.com")
    review = Review(
        client=client,
        model_id="test_id",
        kind=SchemaKind('model'),
        role=Role('msro'),
        version="1.1.2"
    )
    assert isinstance(review, Review)
