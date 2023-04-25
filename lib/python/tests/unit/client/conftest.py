from unittest.mock import Mock

import pytest
from requests import Response

from bailoclient.client.auth import NullAuthenticator


@pytest.fixture
def mock_response():
    return Mock(spec=Response)


@pytest.fixture
def mock_auth():
    class MockAuth(NullAuthenticator):
        """Mock to test adding auth headers"""

        def get_authorisation_headers(self):
            return {"header": "value"}

    return MockAuth()


@pytest.fixture
def deployment_1():
    return {
        "metadata": {
            "highLevelDetails": {
                "name": "deployment_name",
                "modelID": "id",
                "initialVersionRequested": "1",
            },
            "timeStamp": "2022-09-29T14:08:37.528Z",
        }
    }


@pytest.fixture
def deployment_2():
    return {
        "metadata": {
            "highLevelDetails": {
                "name": "deployment_name",
                "modelID": "id",
                "initialVersionRequested": "2",
            },
            "timeStamp": "2022-09-30T14:08:37.528Z",
        }
    }
