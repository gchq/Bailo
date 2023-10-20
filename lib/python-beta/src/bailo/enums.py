from enum import Enum

class ModelVisibility(str, Enum):
    Private = 'private'
    Public = 'public'

class SchemaKind(str, Enum):
    Model = 'model'
    AccessRequest = 'accessRequest'
