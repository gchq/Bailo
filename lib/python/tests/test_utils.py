from __future__ import annotations

import pytest
from bailo.core.utils import NestedDict, filter_none, normalise_query_params


def test_NestedDict_get_single_key():
    d = NestedDict({"a": 1})
    assert d["a"] == 1


def test_NestedDict_get_nested_tuple_key():
    d = NestedDict({"a": {"b": {"c": 5}}})
    assert d[("a", "b", "c")] == 5


def test_NestedDict_set_single_key():
    d = NestedDict()
    d["a"] = 10
    assert d["a"] == 10


def test_NestedDict_set_nested_tuple_creates_structure():
    d = NestedDict()
    d[("a", "b", "c")] = 42

    assert d["a"]["b"]["c"] == 42
    assert d[("a", "b", "c")] == 42


def test_NestedDict_set_nested_existing_structure():
    d = NestedDict({"a": {"b": {}}})
    d[("a", "b", "c")] = "value"

    assert d["a"]["b"]["c"] == "value"


def test_NestedDict_overwrite_nested_value():
    d = NestedDict({"a": {"b": {"c": 1}}})
    d[("a", "b", "c")] = 2

    assert d[("a", "b", "c")] == 2


def test_NestedDict_key_error_on_missing_path():
    d = NestedDict({"a": {"b": {}}})

    with pytest.raises(KeyError):
        _ = d[("a", "b", "c")]


def test_NestedDict_list_value_storage():
    d = NestedDict()
    d[("a", "b")] = [1, 2, 3]

    assert d["a"]["b"] == [1, 2, 3]


def test_NestedDict_mixed_usage_single_and_tuple():
    d = NestedDict()

    d["a"] = {}
    d[("a", "b")] = 100

    assert d[("a", "b")] == 100


def test_NestedDict_nested_dict_behaves_like_dict():
    d = NestedDict()
    d["x"] = 1
    d["y"] = 2

    assert set(d.keys()) == {"x", "y"}
    assert dict(d) == {"x": 1, "y": 2}


def test_filter_none_should_keep_single_empty_dict():
    assert filter_none({}) == {}


def test_filter_none_should_keep_single_empty_array():
    assert filter_none([]) == []  # type: ignore[reportArgumentType]


def test_filter_none_should_remove_empty_dict():
    assert filter_none({"foo": "a", "bar": 1, "baz": [1, 2, 3], "bat": {}}) == {"foo": "a", "bar": 1, "baz": [1, 2, 3]}


def test_filter_none_should_remove_nested_empty_dicts():
    assert filter_none({"foo": {"bar": {"baz": {"bat": {}}}}}) == {}


def test_filter_none_should_not_remove_nested_empty_arrays():
    assert filter_none({"foo": {"bar": {"baz": {"bat": []}}}}) == {"foo": {"bar": {"baz": {"bat": []}}}}


def test_filter_none_should_remove_nested_none():
    assert filter_none({"foo": {"bar": {"baz": {"bat": None}}}}) == {}


def test_filter_none_should_leave_booleans():
    assert filter_none({"foo": {"bar": {"baz": {"bat": True, "qux": False}}}}) == {
        "foo": {"bar": {"baz": {"bat": True, "qux": False}}}
    }


def test_filter_none_removes_top_level_none():
    assert filter_none({"a": None, "b": 1}) == {"b": 1}


def test_filter_none_keeps_zero_and_empty_string():
    input = {"a": 0, "b": "", "c": None}
    expected = {"a": 0, "b": ""}
    assert filter_none(input) == expected


def test_filter_none_removes_empty_dict_after_cleaning():
    input = {"a": {"b": None}}
    assert filter_none(input) == {}


def test_filter_none_keeps_empty_list():
    input = {"a": []}
    assert filter_none(input) == {"a": []}


def test_filter_none_list_with_none_values():
    input = {"a": [1, None, 2]}
    # None inside lists is preserved by current implementation
    assert filter_none(input) == {"a": [1, None, 2]}


def test_filter_none_nested_list_dict_cleanup():
    input = {"a": [{"b": None}, {"c": 1}]}
    expected = {"a": [{}, {"c": 1}]}
    assert filter_none(input) == expected


def test_filter_none_tuple_is_converted_to_list():
    input = {"a": (1, None, {"b": None})}
    expected = {"a": [1, None, {}]}
    assert filter_none(input) == expected


def test_filter_none_string_not_treated_as_sequence():
    input = {"a": "hello", "b": None}
    expected = {"a": "hello"}
    assert filter_none(input) == expected


def test_filter_none_bytes_not_treated_as_sequence():
    input = {"a": b"abc", "b": None}
    expected = {"a": b"abc"}
    assert filter_none(input) == expected


def test_filter_none_deep_mixed_structure():
    input = {
        "a": None,
        "b": {
            "c": None,
            "d": [{"e": None}, {"f": 2}],
        },
        "g": [],
    }
    expected = {
        "b": {
            "d": [{}, {"f": 2}],
        },
        "g": [],
    }
    assert filter_none(input) == expected


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


def test_normalise_query_params_bool_true():
    assert normalise_query_params(True) == "true"


def test_normalise_query_params_bool_false():
    assert normalise_query_params(False) == "false"


def test_normalise_query_params_string_booleans():
    assert normalise_query_params("True") == "True"
    assert normalise_query_params("False") == "False"


def test_normalise_query_params_string_non_boolean():
    assert normalise_query_params("hello") == "hello"


def test_normalise_query_params_dict_with_bool():
    assert normalise_query_params({"a": True, "b": False}) == {"a": "true", "b": "false"}


def test_normalise_query_params_nested_dict():
    input = {"a": {"b": True}}
    expected = {"a": {"b": "true"}}
    assert normalise_query_params(input) == expected


def test_normalise_query_params_list_with_bool():
    assert normalise_query_params([True, False]) == ["true", "false"]


def test_normalise_query_params_nested_list_dict():
    input = {"a": [{"b": True}, {"c": False}]}
    expected = {"a": [{"b": "true"}, {"c": "false"}]}
    assert normalise_query_params(input) == expected


def test_normalise_query_params_tuple_sequence():
    input = (True, False)
    expected = ["true", "false"]
    assert normalise_query_params(input) == expected


def test_normalise_query_params_mixed_structure():
    input = {
        "a": True,
        "b": ["True", False, {"c": "False"}],
        "d": {"e": True},
    }
    expected = {
        "a": "true",
        "b": ["True", "false", {"c": "False"}],
        "d": {"e": "true"},
    }
    assert normalise_query_params(input) == expected
