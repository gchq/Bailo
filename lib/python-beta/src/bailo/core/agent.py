from __future__ import annotations

from json import JSONDecodeError

import requests
from requests.auth import HTTPBasicAuth
from bailo.core.exceptions import BailoException, ResponseException


class Agent:
    """Base API Agent for talking with Bailo.

    Wraps each request in an exception handler that maps API errors to Python Bailo errors, among status codes less than 400.
    Defaults request timeout to 5 seconds.
    """

    def __request(self, method, *args, **kwargs):
        if "timeout" not in kwargs:
            kwargs["timeout"] = 5
        if "verify" not in kwargs:
            kwargs["verify"] = True

        res = requests.request(method, *args, **kwargs)

        # Check response for a valid range
        if res.status_code < 400:
            return res

        try:
            # Give the error message issued by bailo
            raise BailoException(res.json()["error"]["message"])
        except JSONDecodeError:
            # No response given
            raise ResponseException(f"{res.status_code} Cannot {method} to {res.request.url}")

    def get(self, *args, **kwargs):
        return self.__request("GET", *args, **kwargs)

    def post(self, *args, **kwargs):
        return self.__request("POST", *args, **kwargs)

    def patch(self, *args, **kwargs):
        return self.__request("PATCH", *args, **kwargs)

    def push(self, *args, **kwargs):
        return self.__request("PUSH", *args, **kwargs)

    def delete(self, *args, **kwargs):
        return self.__request("DELETE", *args, **kwargs)

    def put(self, *args, **kwargs):
        return self.__request("PUT", *args, **kwargs)


class PkiAgent(Agent):
    def __init__(
        self,
        cert: str,
        key: str,
        auth: str,
    ):
        """Initiate an agent for PKI authentication.

        :param cert: Path to cert file
        :param key: Path to key file
        :param auth: Path to certificate authority file
        """
        self.cert = cert
        self.key = key
        self.auth = auth

    def get(self, *args, **kwargs):
        return super().get(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def post(self, *args, **kwargs):
        return super().post(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def put(self, *args, **kwargs):
        return super().put(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def patch(self, *args, **kwargs):
        return super().patch(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def delete(self, *args, **kwargs):
        return super().delete(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)


class TokenAgent(Agent):
    def __init__(
        self,
        access_key: str,
        secret_key: str,
    ):
        """Initiate an agent for API token authentication.

        :param access_key: Access key
        :param secret_key: Secret key
        """
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
