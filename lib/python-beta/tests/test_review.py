from __future__ import annotations

import datetime

from bailo import Client
from bailo.core.enums import ReviewDecision, Role, SchemaKind
from bailo.helper.reviews import Review, ReviewResponse


def test_create_review():
    """ Test that a review can be created
    """
    client = Client("https://example.com")
    review = Review(client=client,
                    model_id="test_id",
                    kind=SchemaKind('model'),
                    role=Role('msro'),
                    version="1.1.2",
                    created_at=datetime.time,
                    updated_at=datetime.time(1),
                    response=ReviewResponse(Role('msro'),
                                            ReviewDecision.Approve,
                                            "lgtm"))

def test_make_review():
    client = Client("http://localhost:8080")
    result = Review.make_review(client, "bosh-ggcpfp", "608.257.235",role=Role('msro'), decision=ReviewDecision.Approve, comment="lgtm")
