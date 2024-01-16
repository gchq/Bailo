from __future__ import annotations

from typing import Any


def filter_none(json: dict[str, Any]) -> dict[str, Any]:
    """Remove None attributes from a dictionary.

    :param json: Dictionary to filter
    :return: Dictionary with removed Nonetypes
    """
    res = {k: v for k, v in json.items() if v is not None}
    return res
