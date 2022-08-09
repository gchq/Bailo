"""Interface for the BAILO API"""

import abc
from typing import Dict, Optional

import requests
import requests_pkcs12

from bailoclient.utils.exceptions import NoServerResponseMessage

from .auth import AuthenticationInterface, Pkcs12Authenticator, UnauthorizedException
from .config import BailoConfig


class APIInterface(abc.ABC):
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


class AuthorisedAPI(APIInterface):
    """Authorised API interface"""

    def __init__(self, config: BailoConfig, auth: AuthenticationInterface):
        self.config = config
        self.auth = auth
        self.verify_certificates = self.config.api.ca_verify
        self.timeout_period = 5  # timeout periods in seconds

    def _form_url(self, request_path: str) -> str:
        if request_path.startswith("/"):
            return f"{self.config.api.url}{request_path}"

        return f"{self.config.api.url}/{request_path}"

    def _get_headers(self, input_headers: Optional[Dict] = None) -> Dict[str, str]:
        if input_headers:
            input_headers.update(self.auth.get_authorisation_headers())
            return input_headers

        return {**self.auth.get_authorisation_headers()}

    def get(
        self,
        request_path: str,
        request_params: Optional[Dict[str, str]] = None,
        headers: Optional[Dict] = None,
    ) -> Dict[str, str]:
        """Make a GET request against the API.
           This will not do any validation of parameters prior to sending.

        Args:
            request_path (str): The requested path relative to the API (e.g. /model/summary)
            request_params (Optional[Dict[str, str]]): Any query parameters to be passed to the API
            headers (Optional[Dict], optional): A JSON object returned by the API.
                                                Returns an empty dictionary if the request fails.
                                                Defaults to None.

        Raises:
            UnauthorizedException: Unable to access the server

        Returns:
            Dict[str, str]: Response JSON from the server
        """

        url = self._form_url(request_path)
        headers = self._get_headers(headers)

        response = None
        if isinstance(self.auth, Pkcs12Authenticator):
            response = requests_pkcs12.get(
                url,
                pkcs12_filename=self.config.pki.pkcs12_filename,
                pkcs12_password=self.config.pki.pkcs12_password,
                params=request_params,
                headers=headers,
                timeout=self.timeout_period,
                verify=self.verify_certificates,
            )
        else:
            response = requests.get(
                url,
                params=request_params,
                headers=headers,
                timeout=self.timeout_period,
                verify=self.verify_certificates,
            )

        if 200 <= response.status_code < 300:
            return response.json()

        if response.status_code == 401:
            try:
                data = response.json()
                raise UnauthorizedException(data)
            except NoServerResponseMessage:
                response.raise_for_status()

        response.raise_for_status()

        return {}

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
            request_params (Optional[Dict[str, str]]): Any query parameters to be passed to the API
            headers (Optional[Dict], optional): A JSON object returned by the API.
                                                Returns an empty dictionary if the request fails.
                                                Defaults to None.

        Raises:
            UnauthorizedException: Unable to access the server

        Returns:
            Dict[str, str]: Response JSON from the server
        """
        url = self._form_url(request_path)
        headers = self._get_headers(headers)

        response = None
        if isinstance(self.auth, Pkcs12Authenticator):
            response = requests_pkcs12.get(
                url,
                pkcs12_filename=self.config.pki.pkcs12_filename,
                pkcs12_password=self.config.pki.pkcs12_password,
                data=request_body,
                params=request_params,
                headers=headers,
                timeout=self.timeout_period,
                verify=self.verify_certificates,
            )
        else:
            response = requests.post(
                url,
                data=request_body,
                params=request_params,
                headers=headers,
                timeout=self.timeout_period,
                verify=self.verify_certificates,
            )

        if 200 <= response.status_code < 300:
            return response.json()

        if response.status_code == 401:
            try:
                data = response.json()
                raise UnauthorizedException(data)
            except NoServerResponseMessage:
                response.raise_for_status()

        response.raise_for_status()

        return {}

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
            request_params (Optional[Dict[str, str]]): Any query parameters to be passed to the API
            headers (Optional[Dict], optional): A JSON object returned by the API.
                                                Returns an empty dictionary if the request fails.
                                                Defaults to None.

        Raises:
            UnauthorizedException: Unable to access the server

        Returns:
            Dict[str, str]: Response JSON from the server
        """

        url = self._form_url(request_path)
        headers = self._get_headers(headers)

        response = None
        if isinstance(self.auth, Pkcs12Authenticator):
            response = requests_pkcs12.get(
                url,
                pkcs12_filename=self.config.pki.pkcs12_filename,
                pkcs12_password=self.config.pki.pkcs12_password,
                data=request_body,
                params=request_params,
                headers=headers,
                timeout=self.timeout_period,
                verify=self.verify_certificates,
            )
        else:
            response = requests.put(
                url,
                data=request_body,
                params=request_params,
                headers=headers,
                timeout=self.timeout_period,
                verify=self.verify_certificates,
            )

        if 200 <= response.status_code < 300:
            return response.json()

        if response.status_code == 401:
            try:
                data = response.json()
                raise UnauthorizedException(data)
            except NoServerResponseMessage:
                response.raise_for_status()

        response.raise_for_status()

        return {}
