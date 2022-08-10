"""Exceptions"""


class UnconnectedClient(Exception):
    """Client has not yet been connected"""


class ModelSchemaMissing(Exception):
    """No schema for a model"""


class DataInvalid(Exception):
    """Invalid data for creating a model"""


class NoServerResponseMessage(Exception):
    """The server did not send a response message"""


class UnauthorizedException(Exception):
    """User not authorised"""


class DataInvalid(Exception):
    """Model data is invalid"""


class InvalidMetadata(Exception):
    """Metadata does not meet the minimal requirement"""
