from __future__ import annotations

from typing import Any

import requests

from .exceptions import BailoException


class Agent:
    def __init__(self):
        pass

    def __request(self, method:str, **kwargs):
        res = requests.request(method, **kwargs)

        # Check response for a valid range
        if 200 <= res.status_code < 400:
            return res

        # Give the error message issued by bailo
        raise BailoException(res.json()["error"]["message"])

    def get(self, **kwargs):
        return self.__request("GET", **kwargs)

    def post(self, **kwargs: Any):
        return self.__request("POST", **kwargs)

    def patch(self, **kwargs: Any):
        return self.__request("PATCH", **kwargs)

    def push(self, **kwargs: Any):
        return self.__request("PUSH", **kwargs)

    def delete(self,url:str, **kwargs: Any):
        return self.__request("DELETE", **kwargs)

    def put(self,url:str, json:Any, **kwargs: Any):
        return self.__request("PUT", **kwargs)


class PkiAgent:
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
