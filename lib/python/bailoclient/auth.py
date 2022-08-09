"""All authenticators"""

# pylint: disable=arguments-differ

import abc
from typing import Dict, Optional

from warrant.aws_srp import AWSSRP

from .config import BailoConfig
from .utils.exceptions import UnauthorizedException


class AuthenticationInterface(abc.ABC):
    """Abstract base class for Authentication"""

    @abc.abstractmethod
    def __init__(self, config: BailoConfig):
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

    def __init__(self, config: BailoConfig):
        """Initialise an authentication method from config"""
        self.config = config

    def authenticate_user(self, *args, **kwargs) -> bool:
        """Authenticate the user. Returns False if the authentication fails

        Returns:
            bool: True if authentication is successful
        """
        return True

    def is_authenticated(self) -> bool:
        """ "Returns True if the user is authenticated

        Returns:
            bool: True if authenicated
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


class Pkcs12Authenticator(AuthenticationInterface):
    """Dummy class that doesn't actually do any authentication, but using this class
    allows the API to know to use the P12 certificate in the config to make requests
    """

    def __init__(self, config: BailoConfig):
        """Initialise an authentication method from config"""
        self.config = config

    def authenticate_user(self, *args, **kwargs) -> bool:
        """Authenticate the user. Returns False if the authentication fails

        Returns:
            bool: True if authentication is successful
        """
        return True

    def is_authenticated(self) -> bool:
        """ "Returns True if the user is authenticated

        Returns:
            bool: True if authenicated
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


class CognitoSRPAuthenticator(AuthenticationInterface):
    """Authentication implementation for Cognito SRP using username/password"""

    def __init__(self, config: BailoConfig):
        self.config = config
        self.username = None
        self.password = None
        self.authentication_result = None

    def __try_authorise(self, username: str, password: str) -> Dict[str, str]:
        """Call the AWS Cognito API and try to authenticate with username and password.
        Returns the response object
        """
        aws = AWSSRP(
            username=username,
            password=password,
            pool_id=self.config.cognito.user_pool_id,
            client_id=self.config.cognito.client_id,
            client_secret=self.config.cognito.client_secret,
            pool_region=self.config.cognito.region,
        )
        return aws.authenticate_user()

    def authenticate_user(self, username: str, password: str) -> bool:
        """Authenticate the user using AWS Cognito. Returns False if the authentication fails

        Args:
            username (str): username for cognito user pool
            password (str): password for cognito user pool

        Returns:
            bool: True if authentication is successful
        """

        response = self.__try_authorise(username, password)

        if (
            "AuthenticationResult" in response
            and "AccessToken" in response["AuthenticationResult"]
        ):
            self.authentication_result = response["AuthenticationResult"]
            self.username = username
            self.password = password

            return True

        return False

    def is_authenticated(self) -> bool:
        """ "Returns True if the user is authenticated

        Returns:
            bool: True if authenicated
        """
        return self.username is not None and self.password is not None

    def get_authorisation_headers(self) -> Optional[str]:
        """Authenticate and get a secure token than can be used to send an API request.
           Return None if the authentication fails
           Note that this interface will definitely change once more auth types are explored.

        Returns:
            Optional[Dict[str, str]]: AWS access token if auth is successful, else None
        """

        if not self.authentication_result:
            raise UnauthorizedException("Authenticator not yet authorised.")

        return {"Authorization": "Bearer " + self.authentication_result["AccessToken"]}
