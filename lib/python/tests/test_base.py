import pytest
from bailoclient.models.base import BailoBase


@pytest.fixture
def bailo_base():
    return BailoBase({"_id": "id", "property": "value"})


def test_on_init_dictionary_gets_added_as_properties_and_values_to_bailo_base(
    bailo_base,
):
    assert bailo_base._id == "id"
    assert bailo_base.property == "value"


def test_on_init_properties_are_added_by_kwargs():
    bailo_base = BailoBase(_id="id", property="value")

    assert bailo_base._id == "id"
    assert bailo_base.property == "value"


def test_get_self_without_id_removes_id(bailo_base):
    self_no_id = bailo_base._get_self_without_id()

    assert self_no_id == {"property": "value"}


def test_str_representation_does_not_include_id(bailo_base):
    assert str(bailo_base) == '{"property": "value"}'


def test_dir_bailo_base_does_not_include_id_and_includes_display_and_list_fields(
    bailo_base,
):
    assert dir(bailo_base) == ["display", "list_fields", "property"]


def test_display_returns_str_representation_if_not_printing_to_screen(bailo_base):
    pretty_json = bailo_base.display(to_screen=False)

    assert isinstance(pretty_json, str)


def test_display_returns_none_if_printing_to_screen(bailo_base):
    assert not bailo_base.display(to_screen=True)
