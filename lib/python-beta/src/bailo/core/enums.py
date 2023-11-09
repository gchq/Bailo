from __future__ import annotations

from enum import Enum


class ModelVisibility(str, Enum):
    Private = 'private'
    Public = 'public'

    def __str__(self):
        return str(self.value)

class SchemaKind(str, Enum):
    Model = 'model'
    AccessRequest = 'accessRequest'
