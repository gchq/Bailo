from bailoclient.utils import utils


def test_get_filename_and_mimetype_correctly_identifies_json_name_and_mimetype():
    filename, m_type = utils.get_filename_and_mimetype("tests/data/responses.json")

    assert filename == "responses.json"
    assert m_type == "application/json"


def test_get_filename_and_mimetype_returns_mimetype_of_none_if_path_is_directory():
    filename, m_type = utils.get_filename_and_mimetype("tests/data")

    assert filename == "data"
    assert m_type is None


def test_get_filename_and_mimetype_guesses_name_and_type_even_if_the_file_does_not_exist():
    filename, m_type = utils.get_filename_and_mimetype(
        "path/does/not/exist/responses.json"
    )

    assert filename == "responses.json"
    assert m_type == "application/json"


def test_minimal_keys_in_dict_returns_valid_result_if_both_dictionaries_are_empty():
    result = utils.minimal_keys_in_dictionary({}, {})

    assert result == {"valid": True}


def test_minimal_keys_in_dict_returns_error_if_dict2_does_not_include_key_from_minimal_dict():
    result = utils.minimal_keys_in_dictionary({"key1": "value1"}, {})

    assert not result["valid"]
    assert result["error_message"] == "must contain 'key1'"


def test_minimal_keys_in_dict_returns_error_if_dict2_has_empty_value_for_key_from_minimal_dict():
    result = utils.minimal_keys_in_dictionary({"key1": "value1"}, {"key1": None})

    assert not result["valid"]
    assert result["error_message"] == "'key1' cannot be empty"


def test_minimal_keys_in_dict_returns_error_if_dict2_is_missing_subkeys_from_minimal_dict():
    result = utils.minimal_keys_in_dictionary(
        {"key1": {"key2": "value1"}}, {"key1": "value1"}
    )

    assert not result["valid"]
    assert result["error_message"] == "missing data under 'key1'"


def test_minimal_keys_in_dict_validates_if_minimal_dict_is_empty():
    result = utils.minimal_keys_in_dictionary({}, {"key1": "value1"})

    assert result["valid"]


def test_minimal_keys_in_dict_ignores_extra_keys_in_dict2():
    result = utils.minimal_keys_in_dictionary(
        {"key1": "value"}, {"key1": "value1", "key2": "value2"}
    )

    assert result["valid"]


def test_minimal_keys_in_dict_validates_multilevel_dictionaries():
    result = utils.minimal_keys_in_dictionary(
        {"key1": {"key2": {"key3": "value"}}}, {"key1": {"key2": {"key3": "value"}}}
    )

    assert result["valid"]
