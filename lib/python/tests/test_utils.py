from __future__ import annotations

from bailo.core.utils import _is_empty_container, filter_none


def test_filter_none_empty_dict():
    assert filter_none({}) == {}


def test_filter_none_empty_array():
    assert filter_none([]) == []


def test_filter_none_remove_empty_dict():
    assert filter_none({"foo": "a", "bar": 1, "baz": [1, 2, 3], "bat": {}}) == {"foo": "a", "bar": 1, "baz": [1, 2, 3]}


def test_filter_none_remove_nested_empty_dicts():
    assert filter_none({"foo": {"bar": {"baz": {"bat": {}}}}}) == {}


def test_filter_none_remove_nested_empty_arrays():
    assert filter_none({"foo": {"bar": {"baz": {"bat": []}}}}) == {}


def test_filter_none_remove_nested_None():
    assert filter_none({"foo": {"bar": {"baz": {"bat": None}}}}) == {}


def test_filter_none_remove_nested_None():
    assert filter_none({"foo": {"bar": {"baz": {"bat": True, "qux": False}}}}) == {
        "foo": {"bar": {"baz": {"bat": True, "qux": False}}}
    }


def test_filter_none_example_providing_none_values():
    """Should keep all provided values."""
    input = {
        "name": "Test Model 1",
        "kind": "model",
        "description": "Testing with an example you might see",
        "settings": {
            "mirror": {
                "sourceModelId": "12345",
            },
        },
        "visibility": "public",
        "organisation": "big corp",
        "state": "active",
        "tags": [],
        "collaborators": ["jimbo"],
    }
    assert filter_none(input) == input


def test_filter_none_example_providing_none_values():
    """Should remove the various None values."""
    input = {
        "name": "Test Model 1",
        "kind": "model",
        "description": "Testing with an example you might see",
        "settings": {
            "mirror": {
                "sourceModelId": None,
            },
        },
        "visibility": "public",
        "organisation": "big corp",
        "state": None,
        "tags": [],
        "collaborators": None,
    }
    output = {
        "name": "Test Model 1",
        "kind": "model",
        "description": "Testing with an example you might see",
        "visibility": "public",
        "organisation": "big corp",
    }
    assert filter_none(input) == output


def test_is_empty_container_empty_dict():
    assert _is_empty_container({}) is True


def test_is_empty_container_empty_list():
    assert _is_empty_container([]) is True


def test_is_empty_container_non_empty_dict():
    assert _is_empty_container({"a": 1}) is False


def test_is_empty_container_non_empty_list():
    assert _is_empty_container([None]) is False


def test_is_empty_container_none():
    assert _is_empty_container(None) is False


def test_is_empty_container_false():
    assert _is_empty_container(False) is False
