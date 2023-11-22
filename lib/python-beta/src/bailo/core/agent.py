from __future__ import annotations

import requests

from .exceptions import BailoError


class Agent:
    def __init__(self):
        pass

    def __request(self, *args, method, **kwargs):
        res = requests.request(method, *args, **kwargs)
        if 200 <= res.status_code < 300:
            return res
        raise BailoError(res.json()['error']['message'])

    def get(self, *args, **kwargs):
        return self.__request(*args, method="GET", **kwargs)

    def post(self, *args, **kwargs):
        return self.__request(*args, method="POST", **kwargs)

    def patch(self, *args, **kwargs):
        return self.__request(*args, method="PATCH", **kwargs)

    def push(self, *args, **kwargs):
        return self.__request(*args, method="PUSH", **kwargs)

    def delete(self, *args, **kwargs):
        return self.__request(*args, method="DELETE", **kwargs)

    def put(self, *args, **kwargs):
        return self.__request(*args, method="PUT", **kwargs)


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
