from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ApiInformation(BaseModel):
    """Public metadata describing the API and integrated scanners."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        json_schema_extra={
            "example": {
                "apiName": "ArtefactScan API",
                "apiVersion": "4.1.0",
                "maxFileSizeBytes": 1024**3,
                "modelscanScannerName": "modelscan",
                "modelscanVersion": "0.8.8",
                "modelscanSupportedExtensions": [".zip", ".bin", ".pickle"],
                "trivyScannerName": "trivy",
                "trivyVersion": "0.70.0",
            }
        },
    )

    apiName: str = Field(..., description="Human-readable API name.")
    apiVersion: str = Field(..., description="Deployed API version.")
    modelscanScannerName: str = Field(..., description="ModelScan package name.")
    modelscanVersion: str = Field(..., description="ModelScan version.")
    trivyScannerName: str = Field(..., description="Trivy integration name.")
    trivyVersion: str = Field(..., description="Trivy engine version.")
    modelscanSupportedExtensions: list[str] = Field(
        ...,
        description="List of accepted file extensions (lowercase, including leading dot) for ModelScan.",
        min_length=1,
    )
    maxFileSizeBytes: int = Field(
        ...,
        description="Maximum allowed upload size in bytes.",
        gt=0,
    )
