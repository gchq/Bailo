from __future__ import annotations

from enum import Enum


class ModelVisibility(str, Enum):
    """Whether a model is publicly visible or not"""

    Private = "private"
    Public = "public"

    def __str__(self):
        return str(self.value)


class SchemaKind(str, Enum):
    """A type of schema"""

    Model = "model"
    AccessRequest = "accessRequest"

    def __str__(self):
        return str(self.value)


class Role(str, Enum):
    """A reviewing role"""

    Owner = "owner"
    ModelTechniqualReviewer = "mtr"
    ModelSeniorResponsibleOfficer = "msro"

    def __str__(self):
        return str(self.value)


class ReviewDecision(str, Enum):
    """Outcome of a review"""

    RequestChanges = "request_changes"
    Approve = "approve"

    def __str__(self):
        return str(self.value)
