from __future__ import annotations

from typing import Any


class BailoException(Exception):
    """General exception for Bailo response errors."""

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        context: dict[str, Any] | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.context = context
        super().__init__(message)

    def __str__(self) -> str:
        lines = []

        prefix = f"[{self.status_code}] " if self.status_code is not None else ""
        lines.append(f"{prefix}{self.message}")

        if self.context and isinstance(self.context, dict):
            validation_errors = self.context.get("validationErrors")
            if validation_errors and isinstance(validation_errors, list):
                lines.append("Validation errors:")
                for err in validation_errors:
                    if isinstance(err, dict):
                        prop = err.get("property", "unknown")
                        msg = err.get("message", "unknown error")
                        lines.append(f"  - {prop}: {msg}")
                    else:
                        lines.append(f"  - {err}")
            else:
                display_items = {k: v for k, v in self.context.items() if k != "documentationUrl"}
                if display_items:
                    lines.append(f"Context: {display_items}")

            documentation_url = self.context.get("documentationUrl")
            if documentation_url:
                lines.append(f"Documentation: {documentation_url}")

        return "\n".join(lines)


class ResponseException(Exception):
    """Exception raised when the Bailo API returns a non-JSON response."""
