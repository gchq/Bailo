from __future__ import annotations

from bailo.core.utils import filter_none


def test_filter_none_should_keep_single_empty_dict():
    assert filter_none({}) == {}


def test_filter_none_should_keep_single_empty_array():
    assert filter_none([]) == []


def test_filter_none_should_remove_empty_dict():
    assert filter_none({"foo": "a", "bar": 1, "baz": [1, 2, 3], "bat": {}}) == {"foo": "a", "bar": 1, "baz": [1, 2, 3]}


def test_filter_none_should_remove_nested_empty_dicts():
    assert filter_none({"foo": {"bar": {"baz": {"bat": {}}}}}) == {}


def test_filter_none_should_not_remove_nested_empty_arrays():
    assert filter_none({"foo": {"bar": {"baz": {"bat": []}}}}) == {"foo": {"bar": {"baz": {"bat": []}}}}


def test_filter_none_should_remove_nested_none():
    assert filter_none({"foo": {"bar": {"baz": {"bat": None}}}}) == {}


def test_filter_none_should_remove_nested_none():
    assert filter_none({"foo": {"bar": {"baz": {"bat": True, "qux": False}}}}) == {
        "foo": {"bar": {"baz": {"bat": True, "qux": False}}}
    }


def test_filter_none_should_keep_provided_values():
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


def test_filter_none_should_remove_none_values():
    """Should keep all provided values and remove none values."""
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
        "tags": [],
    }
    assert filter_none(input) == output


def test_filter_none_should_remove_none_values_and_keep_empty_arrays():
    """Should remove the various none values but maintain nested empty arrays."""
    input = {
        "name": "Test Model 1",
        "kind": "model",
        "description": "Testing with an example you might see",
        "settings": {
            "mirror": {
                "sourceModelId": None,
            },
        },
        "something": {"somethingNested": []},
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
        "something": {"somethingNested": []},
        "visibility": "public",
        "organisation": "big corp",
        "tags": [],
    }
    assert filter_none(input) == output
