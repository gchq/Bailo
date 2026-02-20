from http import HTTPStatus
from typing import Any

SCAN_IMAGE_RESPONSES: dict[int | str, dict[str, Any]] = {
    HTTPStatus.OK.value: {
        "description": "trivy returned an sbom",
        "content": {
            "application/json": {
                "examples": {
                    "Empty": {
                        "value": {
                            "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
                            "bomFormat": "CycloneDX",
                            "specVersion": "1.6",
                            "serialNumber": "urn:uuid:c950496a-eebc-4022-8ff3-812500eab6ab",
                            "version": 1,
                            "metadata": {
                                "timestamp": "1970-01-01T00:00:00+00:00",
                                "tools": {
                                    "components": [
                                        {
                                            "type": "application",
                                            "manufacturer": {"name": "Aqua Security Software Ltd."},
                                            "group": "aquasecurity",
                                            "name": "trivy",
                                            "version": "0.68.2",
                                        }
                                    ]
                                },
                                "component": {
                                    "bom-ref": "1641bd45-e2ea-4ca8-8dea-78f047e68aac",
                                    "type": "application",
                                    "name": "/tmp/tmp",
                                    "properties": [{"name": "aquasecurity:trivy:SchemaVersion", "value": "2"}],
                                },
                            },
                            "components": [],
                            "dependencies": [{"ref": "1641bd45-e2ea-4ca8-8dea-78f047e68aac", "dependsOn": []}],
                            "vulnerabilities": [],
                        }
                    }
                }
            }
        },
    }
}
