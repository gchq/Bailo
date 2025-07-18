from __future__ import annotations

import os
from typing import Any

NO_COLOR = "NO_COLOR" in os.environ


def filter_none(json: dict[str, Any]) -> dict[str, Any]:
    """Remove keys with None values from the given dictionary.

    :param json: The dictionary to filter
    :return: Dictionary with removed None-valued keys
    """
    res = {k: v for k, v in json.items() if v is not None}
    return res


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
