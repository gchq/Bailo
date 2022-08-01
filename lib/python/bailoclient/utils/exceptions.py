class UnexpectedApiException(Exception):
    pass


class UnconnectedClient(Exception):
    pass


class UserNotFound(Exception):
    pass


class ModelSchemaMissing(Exception):
    pass


class DataInvalid(Exception):
    pass
