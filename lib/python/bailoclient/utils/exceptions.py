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


class InvalidFilePath(Exception):
    """Filepath does not exist or is otherwise invalid"""


class InvalidMetadata(Exception):
    """Metadata does not meet the minimal requirement"""


class CannotIncrementVersion(Exception):
    """Unable to automatically increment a model card version"""


class UnableToCreateBailoClient(Exception):
    """Unable to create BAILO client based on user input"""


class MissingDotEnvFile(Exception):
    """Unable to find dotenv file containing authentication parameters"""


class IncompleteDotEnvFile(Exception):
    """Dotenv file doesn't contain all required parameters for client authentication"""


class InvalidFileRequested(Exception):
    """Invalid file type requested for download"""


class DeploymentNotFound(Exception):
    """Could not find a deployment"""


class ModelFileExportNotAllowed(Exception):
    """Exporting model files not allowed for this model"""


class ModelFlavourNotFound(Exception):
    """MLflow model flavour not found"""


class ModelTemplateNotAvailable(Exception):
    """No model.py template code available"""


class DirectoryNotFound(Exception):
    """Unable to find directory"""


class ModelMethodNotAvailable(Exception):
    """Model bundler/loader function hasn't been implemented for the model type"""


class MissingFilesError(Exception):
    """Some of the files required for bundling the ML model are missing"""
