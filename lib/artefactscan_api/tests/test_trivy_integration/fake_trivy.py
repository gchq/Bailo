#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(prog="trivy", add_help=False)
    parser.add_argument("--version", action="store_true")

    subparsers = parser.add_subparsers(dest="command")

    rootfs = subparsers.add_parser("rootfs", add_help=False)
    rootfs.add_argument("--output", required=True)
    rootfs.add_argument("path", nargs="?")

    sbom = subparsers.add_parser("sbom", add_help=False)
    sbom.add_argument("--output", required=True)
    sbom.add_argument("path", nargs="?")

    args, _ = parser.parse_known_args()

    if args.version:
        print("Version: 0.0.0-test")
        sys.exit(0)

    if args.command == "rootfs":
        Path(args.output).write_text(json.dumps({"sbom": "dummy"}), encoding="utf-8")
        sys.exit(0)

    if args.command == "sbom":
        Path(args.output).write_text(
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
            encoding="utf-8",
        )
        sys.exit(0)

    sys.exit(1)


if __name__ == "__main__":
    main()
