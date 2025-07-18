from __future__ import annotations


class BailoException(Exception):
    """General exception for Bailo response errors."""


class ResponseException(Exception):
    """Exception raised when the Bailo API returns a non-JSON response."""
