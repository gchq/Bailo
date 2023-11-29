from __future__ import annotations


class BailoException(Exception):
    """General exception for Bailo response errors."""


class ResponseException(Exception):
    """Exception used if an endpoint gave no response."""
