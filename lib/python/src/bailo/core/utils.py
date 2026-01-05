from __future__ import annotations

import os
from typing import Any

NO_COLOR = "NO_COLOR" in os.environ


def _is_empty_container(value: Any) -> bool:
    """Check whether a value is an empty supported container.

    :param value: The value to check for container emptiness.
    :return: True if the value is an empty dict or empty list, otherwise False.
    """
    return isinstance(value, (list, dict)) and not value


def filter_none(value: Any) -> Any:
    """Recursively remove None values and empty containers from data structures.

    Traverses dictionaries and lists recursively, removing:
    - Keys whose values are None
    - Keys or items whose values become empty dicts or lists after cleaning

    :param value: The value or data structure to clean.
    :return: A cleaned version of the input with None values and empty
             containers removed.
    """

    # If the value is a dictionary, recurse into each value
    if isinstance(value, dict):
        return {
            key: filtered
            for key, val in value.items()
            # Recursively clean the value and assign the result to `filtered`
            if (filtered := filter_none(val)) is not None
            # Drop keys whose cleaned value is an empty dict or list
            and not _is_empty_container(filtered)
        }

    # If the value is a list, recurse into each item
    if isinstance(value, list):
        return [
            filtered
            for item in value
            # Recursively clean the value and assign the result to `filtered`
            if (filtered := filter_none(item)) is not None
            # Drop items that become empty dicts or lists
            and not _is_empty_container(filtered)
        ]

    # Base case:
    # - Return primitive values unchanged
    # - Includes False, True, 0, strings, etc.
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
