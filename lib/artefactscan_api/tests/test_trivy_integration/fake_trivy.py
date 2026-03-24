#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

if "--version" in sys.argv:
    print("Version: 0.0.0-test")
    sys.exit(0)

if "rootfs" in sys.argv:
    out = sys.argv[sys.argv.index("--output") + 1]
    Path(out).write_text(json.dumps({"sbom": "dummy"}), "utf-8")
    sys.exit(0)

if "sbom" in sys.argv:
    out = sys.argv[sys.argv.index("--output") + 1]
    Path(out).write_text(
        json.dumps(
            {
                "Results": [
                    {
                        "Target": "dummy",
                        "Vulnerabilities": [
                            {
                                "VulnerabilityID": "TEST-123",
                                "Severity": "HIGH",
                                "PkgName": "dummy-lib",
                            }
                        ],
                    }
                ]
            }
        ),
        "utf-8",
    )
    sys.exit(0)

sys.exit(1)
