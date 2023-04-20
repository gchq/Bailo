"""Adapters for Client to use for communicating over HTTP"""

import abc
from typing import Dict, Optional

import requests
import requests_pkcs12

from bailoclient.client.auth import (
    Pkcs12Authenticator,
    CognitoSRPAuthenticator,
    NullAuthenticator,
    AuthenticationInterface,
)
from bailoclient.client.utils import get_headers, handle_response, form_url
from bailoclient.config import BailoConfig, Pkcs12Config, CognitoConfig


class HttpInterface(abc.ABC):
    """API interface"""

    @abc.abstractmethod
    def __init__(self, config: BailoConfig, auth: AuthenticationInterface):
        raise NotImplementedError

    @abc.abstractmethod
    def get(
        self,
        request_path: str,
        request_params: Optional[Dict[str, str]],
        headers: Optional[Dict] = None,
        output_dir: Optional[None] = None,
    ) -> Dict[str, str]:
        """Make a GET request against the API.
           This will not do any validation of parameters prior to sending.

        Args:
            request_path (str): The requested path relative to the API (e.g. /model/summary)
            request_body (Dict): The full request body as a dict
            request_params (Optional[Dict[str, str]], optional): Any query parameters to be passed
                                                                 to the API. Defaults to None.
            headers (Optional[Dict], optional): request headers. Defaults to None.

        Raises:
            NotImplementedError: Abstract method must be implemented

        Returns:
            Dict[str, str]: A JSON object returned by the API.
                            Returns an empty dictionary if the request fails.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def post(
        self,
        request_path: str,
        request_body: Dict,
        request_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict] = None,
    ) -> Dict[str, str]:
        """Make a POST request against the API.
           This will not do any validation of parameters prior to sending.

        Args:
            request_path (str): The requested path relative to the API (e.g. /model/summary)
            request_body (Dict): The full request body as a dict
            request_params (Optional[Dict[str, str]], optional): Any query parameters to be passed
                                                                 to the API. Defaults to None.
            headers (Optional[Dict], optional): request headers. Defaults to None.

        Raises:
            NotImplementedError: Abstract method must be implemented

        Returns:
            Dict[str, str]: A JSON object returned by the API.
                            Returns an empty dictionary if the request fails.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def put(
        self,
        request_path: str,
        request_body: Dict,
        request_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict] = None,
    ) -> Dict[str, str]:
        """Make a PUT request against the API.
           This will not do any validation of parameters prior to sending.

        Args:
            request_path (str): The requested path relative to the API (e.g. /model/summary)
            request_body (Dict): The full request body as a dict
            request_params (Optional[Dict[str, str]], optional): Any query parameters to be passed
                                                                 to the API. Defaults to None.
            headers (Optional[Dict], optional): request headers. Defaults to None.

        Raises:
            NotImplementedError: Abstract method must be implemented

        Returns:
            Dict[str, str]: A JSON object returned by the API.
                            Returns an empty dictionary if the request fails.
        """
        raise NotImplementedError


class RequestsAdapter(HttpInterface):
    """HTTP Adapter to communicate to Bailo using requests based libraries"""

    def __init__(self, config: BailoConfig):
        self._bailo_url = config.bailo_url
        self._default_params = {
            "timeout": config.timeout_period,
            "verify": config.ca_verify,
        }

        if isinstance(config.auth, Pkcs12Config):
            self._auth = Pkcs12Authenticator(config.auth)
            self._requests_module = requests_pkcs12
            self._default_params.update(
                {
                    "pkcs12_filename": config.auth.pkcs12_filename,
                    "pkcs12_password": config.auth.pkcs12_password,
                }
            )

        elif isinstance(config.auth, CognitoConfig):
            self._auth = CognitoSRPAuthenticator(config.auth)
            self._requests_module = requests

        elif config.auth is None:
            self._auth = NullAuthenticator(config.auth)
            self._requests_module = requests

        else:
            raise ValueError(
                "Could not identify the authentication type from the config"
            )

    def get(
        self,
        request_path: str,
        request_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict] = None,
        output_dir: Optional[str] = None,
    ) -> Dict[str, str]:
        response = self._requests_module.get(
            form_url(self._bailo_url, request_path),
            params=request_params,
            headers=get_headers(self._auth, headers),
            **self._default_params,
        )
        return handle_response(response, output_dir)

    def post(
        self,
        request_path: str,
        request_body: Dict,
        request_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict] = None,
    ) -> Dict[str, str]:
        response = self._requests_module.post(
            form_url(self._bailo_url, request_path),
            data=request_body,
            params=request_params,
            headers=get_headers(self._auth, headers),
            **self._default_params,
        )
        return handle_response(response)

    def put(
        self,
        request_path: str,
        request_body: Dict,
        request_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict] = None,
    ) -> Dict[str, str]:
        response = self._requests_module.put(
            form_url(self._bailo_url, request_path),
            data=request_body,
            params=request_params,
            headers=get_headers(self._auth, headers),
            **self._default_params,
        )
        return handle_response(response)
