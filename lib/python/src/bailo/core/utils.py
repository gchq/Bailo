from __future__ import annotations

import os
from collections.abc import Mapping, Sequence
from enum import Enum
from typing import Any

NO_COLOR = "NO_COLOR" in os.environ


def filter_none(json: dict[str, Any]) -> dict[str, Any]:
    """Recursively remove keys with None values or empty dicts from the given dictionary.

    :param json: The dictionary to filter
    :return: Dictionary with removed None-valued keys and empty sub-dicts
    """

    def _clean(obj: Any) -> Any:
        if isinstance(obj, Mapping):  # e.g. dict
            cleaned = {k: _clean(v) for k, v in obj.items() if v is not None}
            cleaned = {k: v for k, v in cleaned.items() if v != {}}
            return cleaned
        if isinstance(obj, Sequence) and not isinstance(obj, (str, bytes, bytearray)):  # e.g. list, tuple
            return [_clean(item) for item in obj]
        return obj

    return _clean(json)


def normalise_query_params(value: Any) -> Any:
    """Recursively convert Python values into representations suitable for HTTP query parameters.

    :param value: The value or structure to normalise. May be a scalar, mapping, or sequence
    :return: A normalised value suitable for use as an HTTP query parameter
    """
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, Enum):
        return normalise_query_params(value.value)
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):  # e.g. list, tuple
        return [normalise_query_params(v) for v in value]
    if isinstance(value, Mapping):  # e.g. dict
        return {k: normalise_query_params(v) for k, v in value.items()}
    return value


def normalise_json_params(value: Any) -> Any:
    """Recursively convert Python values into representations suitable for JSON request bodies.

    Unlike normalise_query_params, this preserves booleans as native Python bools
    since JSON natively supports boolean types.

    :param value: The value or structure to normalise. May be a scalar, mapping, or sequence
    :return: A normalised value suitable for use in a JSON request body
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, Enum):
        return normalise_json_params(value.value)
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):  # e.g. list, tuple
        return [normalise_json_params(v) for v in value]
    if isinstance(value, Mapping):  # e.g. dict
        return {k: normalise_json_params(v) for k, v in value.items()}
    return value


class NestedDict(dict):
    def __getitem__(self, keytuple):
        """Retrieve a value from a (possibly nested) dictionary using a single key or a tuple of keys.

        :param keytuple: Single key or tuple of nested keys.
        :return: The value at the specified key path.
        """
        # if key is not a tuple then access as normal
        if not isinstance(keytuple, tuple):
            return super().__getitem__(keytuple)
        d = self
        for key in keytuple:
            d = d[key]
        return d

    def __setitem__(self, keytuple, item):
        """Assign a value within a (possibly nested) dictionary using a single key or a tuple of keys.

        :param keytuple: Single key or tuple of nested keys.
        :param item: The value to assign.
        """
        # if key is not a tuple then access as normal
        if not isinstance(keytuple, tuple):
            super().__setitem__(keytuple, item)
            return
        d = self
        for index, key in enumerate(keytuple):
            if index != len(keytuple) - 1:
                d = d.setdefault(key, {})
            else:
                d[key] = item
