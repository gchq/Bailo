from bailoclient.utils import utils


def test_get_filename_and_mimetype_correctly_identifies_json_name_and_mimetype():
    filename, m_type = utils.get_filename_and_mimetype("tests/data/responses.json")

    assert filename == "responses.json"
    assert m_type == "application/json"


def test_get_filename_and_mimetype_returns_mimetype_of_none_if_path_is_directory():
    filename, m_type = utils.get_filename_and_mimetype("tests/data")

    assert filename == "data"
    assert m_type is None
