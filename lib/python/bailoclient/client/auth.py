"""All authenticators"""

import abc
from typing import Dict, Optional

from pycognito.aws_srp import AWSSRP

from bailoclient.config import AuthenticationConfig, CognitoConfig
from bailoclient.exceptions import UnauthorizedException


class AuthenticationInterface(abc.ABC):
    """Abstract base class for Authentication"""

    @abc.abstractmethod
    def __init__(self, config: AuthenticationConfig):
        """Initialise an authentication method from config"""
        raise NotImplementedError()

    @abc.abstractmethod
    def authenticate_user(self, *args, **kwargs) -> bool:
        """Authenticate the user. Returns False if the authentication fails

        Raises:
            NotImplementedError: Abstract method must be implemented

        Returns:
            bool: True if authentication is successful
        """
        raise NotImplementedError()

    @abc.abstractmethod
    def is_authenticated(self) -> bool:
        """Returns True if the user is authenticated

        Raises:
            NotImplementedError: Abstract method must be implemented

        Returns:
            bool: True if the user is authenticated
        """
        raise NotImplementedError()

    @abc.abstractmethod
    def get_authorisation_headers(self) -> Optional[Dict[str, str]]:
        """Authenticate and get the required headers that can be used to send an API request.
           Return None if the authentication fails
           Note that this interface will definitely change once more auth types are explored.

        Raises:
            NotImplementedError: Abstract method must be implemented

        Returns:
            Optional[Dict[str, str]]: Authorisation headers or None if authentication fails
        """

        raise NotImplementedError()


class NullAuthenticator(AuthenticationInterface):
    """Dummy class that doesn't actually do any authentication"""

    def __init__(self, config: AuthenticationConfig = None):
        """Initialise an authentication method from config"""

    def authenticate_user(self, *args, **kwargs) -> bool:
        """Authenticate the user. Returns False if the authentication fails

        Returns:
            bool: True if authentication is successful
        """
        return True

    def is_authenticated(self) -> bool:
        """ "Returns True if the user is authenticated

        Returns:
            bool: True if authenticated
        """
        return True

    def get_authorisation_headers(self) -> Optional[Dict[str, str]]:
        """Authenticate and get a secure token than can be used to send an API request.
           Return None if the authentication fails
           Note that this interface will definitely change once more auth types are explored.

        Returns:
            Optional[Dict[str, str]]: Authentication headers or None if authentication fails
        """
        return {}


class Pkcs12Authenticator(NullAuthenticator):
    """
    Dummy class that doesn't actually do any authentication, but using this class
    allows the API to know to use the P12 certificate in the config to make requests
    """


class CognitoSRPAuthenticator(AuthenticationInterface):
    """Authentication implementation for Cognito SRP using username/password"""

    def __init__(self, config: CognitoConfig):
        if not isinstance(config, CognitoConfig):
            raise ValueError("Cognito authentication requires a CognitoConfig instance")

        self.config = config
        self.authentication_result = None
        self._authenticated = False

    def __try_authorise(self) -> Dict[str, str]:
        """
        Call the AWS Cognito API and try to authenticate with username and password.
        Returns the response object
        """
        aws = AWSSRP(
            username=self.config.username,
            password=self.config.password,
            pool_id=self.config.user_pool_id,
            client_id=self.config.client_id,
            client_secret=self.config.client_secret,
            pool_region=self.config.region,
        )
        return aws.authenticate_user()

    def authenticate_user(self, *args, **kwargs) -> bool:
        """
        Authenticate the user using AWS Cognito. Returns False if the authentication fails

        Returns:
            bool: True if authentication is successful
        """

        response = self.__try_authorise(self.config.username, self.config.password)

        if (
            "AuthenticationResult" in response
            and "AccessToken" in response["AuthenticationResult"]
        ):
            self.authentication_result = response["AuthenticationResult"]
            self._authenticated = True
            return True

        return False

    def is_authenticated(self) -> bool:
        """ "Returns True if the user is authenticated

        Returns:
            bool: True if authenticated
        """
        return self._authenticated

    def get_authorisation_headers(self) -> Optional[Dict[str, str]]:
        """Authenticate and get a secure token than can be used to send an API request.
           Return None if the authentication fails
           Note that this interface will definitely change once more auth types are explored.

        Returns:
            Optional[Dict[str, str]]: AWS access token if auth is successful, else None
        """

        if not self.authentication_result:
            raise UnauthorizedException("Authenticator not yet authorised.")

        return {"Authorization": "Bearer " + self.authentication_result["AccessToken"]}
