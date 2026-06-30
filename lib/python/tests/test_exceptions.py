from __future__ import annotations

from bailo.core.exceptions import BailoException


def test_message_only():
    exc = BailoException("Something went wrong")
    assert str(exc) == "Something went wrong"


def test_with_status_code():
    exc = BailoException("Not found", status_code=404)
    assert str(exc) == "[404] Not found"


def test_with_validation_errors():
    exc = BailoException(
        "Model metadata could not be validated against the schema.",
        status_code=400,
        context={
            "validationErrors": [
                {"property": "instance.overview.tags", "message": "String does not match pattern"},
                {"property": "instance.overview.modelSummary", "message": "is required"},
            ]
        },
    )
    result = str(exc)
    assert "[400]" in result
    assert "Model metadata could not be validated against the schema." in result
    assert "Validation errors:" in result
    assert "  - instance.overview.tags: String does not match pattern" in result
    assert "  - instance.overview.modelSummary: is required" in result


def test_with_non_dict_validation_error_items():
    exc = BailoException(
        "Validation failed",
        status_code=400,
        context={"validationErrors": ["field X is required", "field Y is invalid"]},
    )
    result = str(exc)
    assert "  - field X is required" in result
    assert "  - field Y is invalid" in result


def test_with_generic_context():
    exc = BailoException(
        "Schema not found.",
        status_code=404,
        context={"modelId": "abc-123"},
    )
    result = str(exc)
    assert "[404] Schema not found." in result
    assert "Context:" in result
    assert "'modelId': 'abc-123'" in result


def test_with_documentation_url():
    exc = BailoException(
        "Error occurred",
        status_code=400,
        context={"documentationUrl": "https://docs.example.com/errors"},
    )
    result = str(exc)
    assert "Documentation: https://docs.example.com/errors" in result


def test_documentation_url_excluded_from_context_display():
    exc = BailoException(
        "Error occurred",
        status_code=400,
        context={"modelId": "abc", "documentationUrl": "https://docs.example.com"},
    )
    result = str(exc)
    assert "Context:" in result
    assert "'modelId': 'abc'" in result
    assert "documentationUrl" not in result.split("Context:")[1].split("\n")[0]
    assert "Documentation: https://docs.example.com" in result


def test_with_non_dict_context():
    exc = BailoException("Error occurred", status_code=500, context="not a dict")  # pyright: ignore[reportArgumentType]
    assert str(exc) == "[500] Error occurred"


def test_backward_compat_args():
    exc = BailoException("test message")
    assert exc.args[0] == "test message"
    assert exc.message == "test message"
    assert exc.status_code is None
    assert exc.context is None


def test_with_empty_context():
    exc = BailoException("test message", context={})
    assert str(exc) == "test message"


def test_validation_error_missing_fields():
    exc = BailoException(
        "Validation failed",
        status_code=400,
        context={"validationErrors": [{}]},
    )
    result = str(exc)
    assert "  - unknown: unknown error" in result


def test_is_catchable_as_exception():
    try:
        raise BailoException("test", status_code=400, context={"key": "value"})
    except Exception as e:
        assert isinstance(e, BailoException)
        assert e.status_code == 400
        assert e.context == {"key": "value"}
