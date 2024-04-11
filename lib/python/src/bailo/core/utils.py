from __future__ import annotations

from typing import Any
import os

NO_COLOR = int(os.environ.get("NO_COLOR", 0))


def filter_none(json: dict[str, Any]) -> dict[str, Any]:
    """Remove None attributes from a dictionary.

    :param json: Dictionary to filter
    :return: Dictionary with removed Nonetypes
    """
    res = {k: v for k, v in json.items() if v is not None}
    return res


class NestedDict(dict):
    def __getitem__(self, keytuple):
        # if key is not a tuple then access as normal
        if not isinstance(keytuple, tuple):
            return super(NestedDict, self).__getitem__(keytuple)
        d = self
        for key in keytuple:
            d = d[key]
        return d

    def __setitem__(self, keytuple, item):
        # if key is not a tuple then access as normal
        if not isinstance(keytuple, tuple):
            return super(NestedDict, self).__setitem__(keytuple, item)
        d = self
        for index, key in enumerate(keytuple):
            if index != len(keytuple) - 1:
                d = d.setdefault(key, {})
            else:
                d[key] = item
