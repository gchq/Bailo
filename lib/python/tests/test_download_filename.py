from __future__ import annotations

from urllib.parse import urlsplit

import pytest
from bailo.core.agent import Agent, TokenAgent
from bailo.core.client import Client
from requests_mock import ANY


@pytest.mark.parametrize("token_auth", [False, True], ids=["standard", "token"])
@pytest.mark.parametrize(
    ("filename", "encoded"),
    [
        ("model.bin", "model.bin"),
        ("model#final.bin", "model%23final.bin"),
        ("model?final.bin", "model%3Ffinal.bin"),
        ("model%23final.bin", "model%2523final.bin"),
        ("model final.bin", "model%20final.bin"),
        ("modèle.bin", "mod%C3%A8le.bin"),
    ],
)
def test_download_filename_is_a_single_url_path_segment(requests_mock, token_auth, filename, encoded):
    agent = TokenAgent(access_key="test-access", secret_key="test-secret") if token_auth else Agent()
    client = Client("https://example.com", agent=agent)
    requests_mock.get(ANY, content=b"model contents")
    prefix = "/api/v2/token" if token_auth else "/api/v2"

    with agent.session:
        response = client.get_download_by_filename("test-model", "1.0.0", filename)

    assert response.content == b"model contents"
    requested = urlsplit(requests_mock.last_request.url)
    assert requested.path == f"{prefix}/model/test-model/release/1.0.0/file/{encoded}/download"
    assert requested.query == ""
    assert requested.fragment == ""
