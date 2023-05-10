"""Exceptions for bailoclient"""


class CannotIncrementVersion(Exception):
    """Unable to automatically increment a model card version"""


class DirectoryNotFound(Exception):
    """Unable to find directory"""


class DeploymentNotFound(Exception):
    """Could not find a deployment"""


class DataInvalid(Exception):
    """Invalid data for creating a model"""


class IncompleteDotEnvFile(Exception):
    """Dotenv file doesn't contain all required parameters for client authentication"""


class InvalidFilePath(Exception):
    """Filepath does not exist or is otherwise invalid"""


class InvalidFileRequested(Exception):
    """Invalid file type requested for download"""


class InvalidMetadata(Exception):
    """Metadata does not meet the minimal requirement"""


class MissingDotEnvFile(Exception):
    """Unable to find dotenv file containing authentication parameters"""


class MissingFilesError(Exception):
    """Some required files required for bundling the ML model are missing"""


class ModelFileExportNotAllowed(Exception):
    """Exporting model files not allowed for this model"""


class ModelFlavourNotFound(Exception):
    """MLflow model flavour not found"""


class ModelMethodNotAvailable(Exception):
    """Model bundler/loader function hasn't been implemented for the model type"""


class ModelSchemaMissing(Exception):
    """No schema for a model"""


class ModelTemplateNotAvailable(Exception):
    """No model.py template code available"""


class NoServerResponseMessage(Exception):
    """The server did not send a response message"""


class UnableToCreateBailoClient(Exception):
    """Unable to create BAILO client based on user input"""


class UnauthorizedException(Exception):
    """User not authorised"""


class UnconnectedClient(Exception):
    """Client has not yet been connected"""


class UserNotFound(Exception):
    """The requested user was not found in the Bailo instance"""
