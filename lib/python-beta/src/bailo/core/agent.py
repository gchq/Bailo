from __future__ import annotations

import requests

from .exceptions import BailoException


class Agent:
    def __init__(self):
        pass

    def __request(self, method, *args, **kwargs):
        res = requests.request(method, *args, **kwargs)

        # Check response for a valid range
        if res.status_code < 400:
            return res

        # Give the error message issued by bailo
        raise BailoException(res.json()['error']['message'])

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


class PkiAgent():
    def __init__(
        self,
        cert: str,
        key: str,
        auth: str,
    ):
        """
        Initiates an agent for PKI authentication.

        :param cert: Path to cert file
        :param key: Path to key file
        :param auth: Path to certificate authority file
        """
        self.cert = cert
        self.key = key
        self.auth = auth

    def get(self, *args, **kwargs):
        return requests.get(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def post(self, *args, **kwargs):
        return requests.post(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def put(self, *args, **kwargs):
        return requests.put(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def patch(self, *args, **kwargs):
        return requests.patch(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)

    def delete(self, *args, **kwargs):
        return requests.delete(*args, cert=(self.cert, self.key), verify=self.auth, **kwargs)
