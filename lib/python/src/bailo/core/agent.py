from __future__ import annotations

import getpass
import logging
import os
from json import JSONDecodeError

import requests
from requests.auth import HTTPBasicAuth

# isort: split

from bailo.core.exceptions import BailoException, ResponseException

logger = logging.getLogger(__name__)


class Agent:
    """Base API Agent for talking with Bailo.

    Wraps each request in an exception handler that maps API errors to Python Bailo errors, among status codes less than 400.

    .. automethod:: __request
    """

    def __init__(
        self,
        verify: str | bool = True,
    ):
        """Initiate a standard agent.

        :param verify: Path to certificate authority file, or bool for SSL verification.
        """
        self.verify = verify

    def __request(self, method, *args, **kwargs):
        """Private method. Make an HTTP request with error handling.

        :param method: HTTP method name (e.g. 'GET', 'POST' etc.).
        :param *args: Positional arguments to requests.request.
        :param **kwargs: Keyword arguments to requests.request.
        :raises BailoException: If Bailo instance returns an error.
        :raises ResponseException: Non-JSON error responses.
        :return: Response object.
        """
        kwargs["verify"] = self.verify

        res = requests.request(method, *args, **kwargs)

        # Check response for a valid range
        if res.status_code < 400:
            return res

        try:
            # Give the error message issued by bailo
            raise BailoException(res.json()["error"]["message"])
        except JSONDecodeError as e:
            # No response given
            raise ResponseException(f"{res.status_code} Cannot {method} to {res.request.url}") from e

    def get(self, *args, **kwargs):
        """Make a GET request. See :func:`__request` for parameters.

        :return: Response object.
        """
        return self.__request("GET", *args, **kwargs)

    def post(self, *args, **kwargs):
        """Make a POST request. See :func:`__request for parameters.

        :return: Response object.
        """
        return self.__request("POST", *args, **kwargs)

    def patch(self, *args, **kwargs):
        """Make a PATCH request. See :func:`__request` for parameters.

        :return: Response object.
        """
        return self.__request("PATCH", *args, **kwargs)

    def push(self, *args, **kwargs):
        """Make a PUSH request. See :func:`__request for parameters.

        :return: Response object.
        """
        return self.__request("PUSH", *args, **kwargs)

    def delete(self, *args, **kwargs):
        """Make a DELETE request. See :func:`__request` for parameters.

        :return: Response object.
        """
        return self.__request("DELETE", *args, **kwargs)

    def put(self, *args, **kwargs):
        """Make a PUT request. See :func:`__request` for parameters.

        :return: Response object.
        """
        return self.__request("PUT", *args, **kwargs)


class PkiAgent(Agent):
    def __init__(self, cert: str, key: str, auth: str, **kwargs):
        """Initiate an agent for PKI authentication.

        :param cert: Path to cert file
        :param key: Path to key file
        :param auth: Path to certificate authority file
        :param **kwargs: Kwargs passed to the super `Agent` class `__init__`
        """
        super().__init__(verify=auth, **kwargs)

        self.cert = cert
        self.key = key

    def get(self, *args, **kwargs):
        return super().get(*args, cert=(self.cert, self.key), **kwargs)

    def post(self, *args, **kwargs):
        return super().post(*args, cert=(self.cert, self.key), **kwargs)

    def put(self, *args, **kwargs):
        return super().put(*args, cert=(self.cert, self.key), **kwargs)

    def patch(self, *args, **kwargs):
        return super().patch(*args, cert=(self.cert, self.key), **kwargs)

    def delete(self, *args, **kwargs):
        return super().delete(*args, cert=(self.cert, self.key), **kwargs)


class TokenAgent(Agent):
    def __init__(
        self,
        access_key: str | None = None,
        secret_key: str | None = None,
        **kwargs,
    ):
        """Initiate an agent for API token authentication.

        :param access_key: Access key
        :param secret_key: Secret key
        :param **kwargs: Kwargs passed to the super `Agent` class `__init__`
        """
        super().__init__(**kwargs)

        if access_key is None:
            logger.info("Access key not provided. Trying other sources...")
            try:
                access_key = os.environ["BAILO_ACCESS_KEY"]
                logger.info("Access key acquired from BAILO_ACCESS_KEY environment variable.")
            except KeyError:
                logger.info("Access key not found in BAILO_ACCESS_KEY environment variable. Requires user input.")
                access_key = getpass.getpass("BAILO ACCESS KEY:")
                logger.info("Access key acquired from user input.")

        if secret_key is None:
            logger.info("Secret key not provided. Trying other sources...")
            try:
                secret_key = os.environ["BAILO_SECRET_KEY"]
                logger.info("Secret key acquired from BAILO_SECRET_KEY environment variable.")
            except KeyError:
                logger.info("Secret key not found in BAILO_SECRET_KEY environment variable. Requires user input.")
                secret_key = getpass.getpass("BAILO SECRET KEY:")
                logger.info("Secret key acquired from user input.")

        self.access_key = access_key
        self.secret_key = secret_key
        self.basic = HTTPBasicAuth(access_key, secret_key)

    def get(self, *args, **kwargs):
        return super().get(*args, auth=self.basic, **kwargs)

    def post(self, *args, **kwargs):
        return super().post(*args, auth=self.basic, **kwargs)

    def put(self, *args, **kwargs):
        return super().put(*args, auth=self.basic, **kwargs)

    def patch(self, *args, **kwargs):
        return super().patch(*args, auth=self.basic, **kwargs)

    def delete(self, *args, **kwargs):
        return super().delete(*args, auth=self.basic, **kwargs)
