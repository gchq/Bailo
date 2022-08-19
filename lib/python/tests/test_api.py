import os
from unittest.mock import MagicMock

import pytest
import responses
from bailoclient.config import APIConfig, BailoConfig

from ..bailoclient.api import AuthorisedAPI
from ..bailoclient.auth import NullAuthenticator
from ..bailoclient.utils.exceptions import UnauthorizedException


@pytest.fixture
def authorised_api():

    api_config = APIConfig(url=os.environ["BAILO_URL"], ca_verify=False)

    config = BailoConfig(api=api_config)

    auth = NullAuthenticator(config)
    auth.get_authorisation_headers = MagicMock(return_value={"header": "value"})

    api = AuthorisedAPI(config, auth)

    return api


def test_form_url_prepends_slash(authorised_api):

    url = "this/is/a/url"
    formed_url = authorised_api._form_url(url)

    assert formed_url == f"{os.environ['BAILO_URL']}/{url}"


def test_form_url_does_not_prepend_slash(authorised_api):

    url = "/this/is/a/url"
    formed_url = authorised_api._form_url(url)

    assert formed_url == f"{os.environ['BAILO_URL']}{url}"


def test_get_headers_returns_merged_headers_if_input_headers_provided(authorised_api):

    headers = authorised_api._get_headers({"new_header": "value2"})

    assert headers == {"header": "value", "new_header": "value2"}


def test_get_headers_returns_auth_headers(authorised_api):

    assert authorised_api._get_headers() == {"header": "value"}


@responses.activate
def test_successful_get_returns_response_json(authorised_api):

    response_json = {"response": "success"}

    responses.add(
        responses.GET,
        f'{os.environ["BAILO_URL"]}/test/get/success',
        json=response_json,
        status=200,
    )

    response = authorised_api.get("/test/get/success")

    assert response == response_json


@responses.activate
def test_unsuccessful_get_raises_exception(authorised_api):
    response_json = {"response": "failure"}

    responses.add(
        responses.GET,
        f'{os.environ["BAILO_URL"]}/test/get/failure',
        json=response_json,
        status=401,
    )

    with pytest.raises(UnauthorizedException):
        response = authorised_api.get("/test/get/failure")
