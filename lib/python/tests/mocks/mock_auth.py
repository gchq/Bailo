from bailoclient.auth import AuthenticationInterface

from typing import Optional, Dict


class MockAuthentication(AuthenticationInterface):
    """Mock authenticator"""

    def __init__(self):
        self.can_authenticate = True
        self.is_authed = False
        pass

    def set_can_authenticate(self, can_authenticate: bool):
        """Resets authentication state and sets whether any future authentication attempts will succeed"""
        self.can_authenticate = can_authenticate
        self.is_authed = False

    def authenticate_user(self) -> bool:
        """Authenticate the user. Returns False if the authentication fails

        : return: True if authentication is successful
        """

        self.is_authed = self.can_authenticate
        return self.is_authed

    def is_authenticated(self) -> bool:
        """Returns True if the user is authenticated"""
        return self.is_authed

    def get_authorisation_headers(self) -> Optional[Dict[str, str]]:
        """Authenticate and get the required headers that can be used to send an API request. Return None if the authentication fails
        Note that this interface will definitely change once more auth types are explored.
        """
        if self.is_authed:
            return None
        return {}
