"""API coverage regression test.

Dynamically discovers what HTTP calls each Client method makes by mocking the Agent,
then compares against the live backend Swagger spec.

Unit tests:
  - Verify every public Client method is callable and produces an HTTP request
  - Fail when a new method is added that cannot be auto-discovered

Integration tests:
  - Fail if any route the client covers no longer exists in the live spec
  - Fail if the live spec defines required parameters the client does not send
  - Report which spec routes are not covered by the client (as a warning)
"""

from __future__ import annotations

import inspect
import re
import typing
import warnings
from enum import Enum
from io import BytesIO
from types import NoneType, UnionType
from unittest.mock import MagicMock
from urllib.parse import urlparse

import pytest
import requests
from conftest import BAILO_URL

from bailo import Client
from bailo.core.agent import Agent

HTTP_METHODS = ("get", "post", "put", "patch", "delete")
VALID_HTTP_METHODS_SET = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"}


# ---------------------------------------------------------------------------
# Type-based test value generation
# ---------------------------------------------------------------------------


def _default_for_type(tp: type) -> object:
    """Return a minimal placeholder value for a resolved type annotation.

    Used to auto-generate arguments when calling Client methods during
    route discovery. Values must survive `filter_none` (so `Any` maps
    to a non-empty dict rather than `{}`).
    """
    simple_types = {
        str: "test-str",
        int: 1,
        bool: True,
        float: 1.0,
        BytesIO: BytesIO(b"test"),
        typing.Any: {"_test": True},
    }
    if tp in simple_types:
        return simple_types[tp]

    origin = getattr(tp, "__origin__", None)

    if origin is list:
        return []
    if origin is dict:
        return {}

    # handle `str | None`` (Python 3.10+ union syntax) and `Optional[str]``
    if isinstance(tp, UnionType) or origin is typing.Union:
        non_none_args = [a for a in tp.__args__ if a is not NoneType]
        return _default_for_type(non_none_args[0]) if non_none_args else None

    if isinstance(tp, type) and issubclass(tp, Enum):
        return list(tp)[0]

    return "test-str"


# ---------------------------------------------------------------------------
# Client method introspection
# ---------------------------------------------------------------------------


def _generate_required_kwargs(func: typing.Callable) -> dict[str, object]:
    """Build a `kwargs` dict containing only the required parameters of *func*.

    Optional parameters (those with defaults) are omitted so the method is
    called with the minimum viable arguments.
    """
    try:
        type_hints = typing.get_type_hints(func)
    except Exception:
        type_hints = {}

    sig = inspect.signature(func)
    kwargs: dict[str, object] = {}

    for param_name, param in sig.parameters.items():
        if param_name == "self":
            continue
        if param.default is not inspect.Parameter.empty:
            continue

        annotation = type_hints.get(param_name)
        kwargs[param_name] = _default_for_type(annotation) if annotation else "test-str"

    return kwargs


def _create_recording_agent() -> MagicMock:
    """Create a mock `Agent` that records HTTP calls and returns a valid response.

    Every HTTP method (get/post/put/patch/delete) returns the same mock response
    where `.json()` yields `{"success": True}`.
    """
    agent = MagicMock(spec=Agent)

    response = MagicMock()
    response.json.return_value = {"success": True}
    response.status_code = 200
    response.request = MagicMock()
    response.request.method = "GET"
    response.request.url = ""

    for method in HTTP_METHODS:
        getattr(agent, method).return_value = response

    return agent


def _reset_agent_call_tracking(agent: MagicMock) -> None:
    """Clear the call history on every HTTP method of a recording agent"""
    for method in HTTP_METHODS:
        getattr(agent, method).reset_mock()


def _find_captured_request(agent: MagicMock) -> tuple[str, str, dict] | None:
    """After calling a Client method, inspect the agent to find which HTTP call was made.

    Returns `(http_method, url_path, call_kwargs)` or `None` if no call was recorded.
    """
    for method in HTTP_METHODS:
        mock_fn = getattr(agent, method)
        if mock_fn.called:
            raw_url = mock_fn.call_args[0][0]
            url_path = str(urlparse(raw_url).path)
            call_kwargs = mock_fn.call_args[1] if mock_fn.call_args[1] else {}
            return method.upper(), url_path, call_kwargs
    return None


def discover_client_routes() -> dict[str, tuple[str, str]]:
    """Call every public Client method with auto-generated args and capture the HTTP request.

    Returns `{method_name: (HTTP_METHOD, url_path)}` for each method that successfully
    produced an outbound HTTP call.
    """
    agent = _create_recording_agent()
    client = Client("https://example.com", agent=agent)
    discovered: dict[str, tuple[str, str]] = {}

    for method_name, bound_method in inspect.getmembers(client, predicate=inspect.ismethod):
        if method_name.startswith("_"):
            continue

        class_method = getattr(Client, method_name)
        kwargs = _generate_required_kwargs(class_method)
        _reset_agent_call_tracking(agent)

        try:
            bound_method(**kwargs)
        except Exception:
            continue

        captured = _find_captured_request(agent)
        if captured:
            http_method, url_path, _ = captured
            discovered[method_name] = (http_method, url_path)

    return discovered


# ---------------------------------------------------------------------------
# OpenAPI/Swagger spec helpers
# ---------------------------------------------------------------------------


def _fetch_swagger_spec() -> dict:
    """Fetch the live OpenAPI spec from the running Bailo backend"""
    resp = requests.get(f"{BAILO_URL}/api/v2/api-docs/swagger.json", timeout=10)
    resp.raise_for_status()
    return resp.json()


def _openapi_path_to_regex(openapi_path: str) -> re.Pattern:
    """Convert `/api/v2/model/{modelId}` to a regex matching concrete URLs.

    Path parameters like `{modelId}` become `[^/]+`, and literal segments are escaped.
    """
    segments = re.split(r"(\{[^}]+\})", openapi_path)
    regex_parts = ["[^/]+" if seg.startswith("{") and seg.endswith("}") else re.escape(seg) for seg in segments]
    return re.compile("^" + "".join(regex_parts) + "$")


def _match_concrete_url_to_spec_path(concrete_path: str, spec_paths: list[str]) -> str | None:
    """Find the OpenAPI path template that matches a concrete URL path.

    For example, `/api/v2/model/abc/release/1.0.0` matches `/api/v2/model/{modelId}/release/{semver}`.
    """
    for spec_path in spec_paths:
        if _openapi_path_to_regex(spec_path).match(concrete_path):
            return spec_path
    return None


def _extract_routes_from_spec(spec: dict) -> set[tuple[str, str]]:
    """Extract all `(HTTP_METHOD, path)` pairs from an OpenAPI spec's `paths` object"""
    routes: set[tuple[str, str]] = set()
    for path, methods in spec.get("paths", {}).items():
        for method in methods:
            if method.upper() in VALID_HTTP_METHODS_SET:
                routes.add((method.upper(), path))
    return routes


# ---------------------------------------------------------------------------
# Unit tests
# ---------------------------------------------------------------------------


def test_all_client_methods_discoverable():
    """Every public Client method must be callable with auto-generated args
    and must produce exactly one outbound HTTP call."""
    agent = _create_recording_agent()
    client = Client("https://example.com", agent=agent)

    public_method_names = [
        name for name, _ in inspect.getmembers(client, predicate=inspect.ismethod) if not name.startswith("_")
    ]
    assert public_method_names, "No public methods found on Client"

    failures = []
    for method_name in public_method_names:
        bound_method = getattr(client, method_name)
        class_method = getattr(Client, method_name)
        kwargs = _generate_required_kwargs(class_method)
        _reset_agent_call_tracking(agent)

        try:
            bound_method(**kwargs)
        except Exception as exc:
            failures.append(f"{method_name}: raised {exc}")
            continue

        if not _find_captured_request(agent):
            failures.append(f"{method_name}: no HTTP call made")

    assert not failures, f"Client methods that could not be auto-discovered:\n{'\n'.join(failures)}"


def test_discovered_routes_have_api_prefix():
    """Every discovered Client route must target the `/api/v2/` URL prefix."""
    routes = discover_client_routes()
    assert routes, "No routes discovered"

    wrong_prefix = [
        f"{name}: {http_method} {path}"
        for name, (http_method, path) in routes.items()
        if not path.startswith("/api/v2/")
    ]

    assert not wrong_prefix, f"Client methods with unexpected URL prefix:\n{'\n'.join(wrong_prefix)}"


# ---------------------------------------------------------------------------
# Integration tests (require live Bailo at localhost:8080)
# ---------------------------------------------------------------------------


@pytest.mark.integration
def test_client_routes_exist_in_swagger():
    """Every route the Python client produces must exist in the live Swagger spec.

    Catches stale client methods that target endpoints removed from the backend.
    """
    spec = _fetch_swagger_spec()
    live_routes = _extract_routes_from_spec(spec)
    all_spec_paths = list({path for _, path in live_routes})

    client_routes = discover_client_routes()
    mismatches = []

    for method_name, (http_method, concrete_path) in client_routes.items():
        matched_spec_path = _match_concrete_url_to_spec_path(concrete_path, all_spec_paths)
        if matched_spec_path is None:
            mismatches.append(f"{method_name}: {http_method} {concrete_path} matches no spec path")
        elif (http_method, matched_spec_path) not in live_routes:
            mismatches.append(f"{method_name}: spec has path {matched_spec_path} but not for method {http_method}")

    assert not mismatches, f"Client methods targeting non-existent backend routes:\n{'\n'.join(mismatches)}"


@pytest.mark.integration
def test_report_uncovered_routes():
    """Emit a warning listing live backend routes the Python client does not cover.

    This test always passes as it is informational and not a gate.
    """
    spec = _fetch_swagger_spec()
    live_routes = _extract_routes_from_spec(spec)
    all_spec_paths = list({path for _, path in live_routes})

    client_routes = discover_client_routes()
    covered_routes: set[tuple[str, str]] = set()

    for http_method, concrete_path in client_routes.values():
        matched_spec_path = _match_concrete_url_to_spec_path(concrete_path, all_spec_paths)
        if matched_spec_path:
            covered_routes.add((http_method, matched_spec_path))

    uncovered_routes = live_routes - covered_routes
    if uncovered_routes:
        sorted_routes = sorted(uncovered_routes, key=lambda r: (r[1], r[0]))
        route_lines = [f"  {method:6s} {path}" for method, path in sorted_routes]
        warnings.warn(
            f"\n{len(uncovered_routes)} backend routes not covered by Python client:\n{'\n'.join(route_lines)}",
            stacklevel=1,
        )


@pytest.mark.integration
def test_swagger_spec_params_match_client():
    """For every endpoint the client covers, required query params and body
    fields in the spec must be present in the client's outbound request.

    Catches drift where the backend adds a required parameter but the Python client doesn't send it.
    """
    spec = _fetch_swagger_spec()
    spec_paths_obj = spec.get("paths", {})
    live_routes = _extract_routes_from_spec(spec)
    all_spec_paths = list({path for _, path in live_routes})

    agent = _create_recording_agent()
    client = Client("https://example.com", agent=agent)
    mismatches = []

    for method_name, bound_method in inspect.getmembers(client, predicate=inspect.ismethod):
        # skip private methods
        if method_name.startswith("_"):
            continue

        class_method = getattr(Client, method_name)
        kwargs = _generate_required_kwargs(class_method)
        _reset_agent_call_tracking(agent)

        try:
            bound_method(**kwargs)
        except Exception:
            continue

        captured = _find_captured_request(agent)
        if not captured:
            continue

        http_method, concrete_path, agent_call_kwargs = captured
        matched_spec_path = _match_concrete_url_to_spec_path(concrete_path, all_spec_paths)
        if not matched_spec_path:
            continue

        endpoint_spec = spec_paths_obj.get(matched_spec_path, {}).get(http_method.lower(), {})
        if not endpoint_spec:
            continue

        # check required query parameters
        spec_required_query_params = {
            p["name"] for p in endpoint_spec.get("parameters", []) if p.get("in") == "query" and p.get("required")
        }
        sent_query_params = (
            set(agent_call_kwargs.get("params", {}).keys()) if agent_call_kwargs.get("params") else set()
        )

        missing_query = spec_required_query_params - sent_query_params
        if missing_query:
            mismatches.append(f"{method_name}: missing required query params {missing_query}")

        # check required body fields
        request_body_schema = (
            endpoint_spec.get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema", {})
        )
        spec_required_body_fields = set(request_body_schema.get("required", []))
        sent_body_fields = set(agent_call_kwargs.get("json", {}).keys()) if agent_call_kwargs.get("json") else set()

        missing_body = spec_required_body_fields - sent_body_fields
        if missing_body:
            mismatches.append(f"{method_name}: missing required body fields {missing_body}")

    assert not mismatches, f"Parameter mismatches:\n{'\n'.join(mismatches)}"
