# ArtefactScan REST API

![Python](https://img.shields.io/badge/python-3.10%20|%203.11%20|%203.12-blue.svg?style=for-the-badge)
![Version](https://img.shields.io/badge/version-4.0.0-orange.svg?style=for-the-badge)
[![License][license-shield]][license-url] [![Contributor Covenant][code-of-conduct-shield]][code-of-conduct-url]

## Overview

**ArtefactScan** is the Bailo scanning service responsible for analysing uploaded artefacts for security risks.
It provides a **single REST API** that orchestrates multiple scanners while keeping their roles explicit and interchangeable.

The built ArtefactScan image is published to [GHCR bailo_artefactscan](https://github.com/gchq/Bailo/pkgs/container/bailo_artefactscan).

### Terminology

- **ArtefactScan** - The umbrella service and API layer within Bailo. It routes artefacts to the appropriate scanners and returns their results.

- **[ModelScan](https://github.com/protectai/modelscan/tree/main)** - ProtectAI scanner used for analysing uploaded files (e.g. model artefacts) for malicious or unsafe content.

- **[Trivy](https://github.com/aquasecurity/trivy)** - Aqua Security scanner used to analyse container image layers for known vulnerabilities and to generate SBOMs.

- **[ClamAV](https://www.clamav.net/)** - Antivirus scanner used elsewhere in Bailo for traditional malware detection on uploaded files (not exposed by this API).

## Quickstart

> **Requires:** Docker, Python 3.10 to 3.12 (local dev only)

### Build and Run via Docker

This is the fastest way to get ArtefactScan REST API running.

```bash
docker build -t artefactscan_rest_api:latest .
docker run -p 0.0.0.0:3311:3311 artefactscan_rest_api:latest
```

- API base URL: `http://localhost:3311`
- Swagger UI: `http://localhost:3311/docs`

## Using the API

Files can be uploaded easily using `curl`.

```bash
curl http://localhost:3311/info
```

### File Scanning (ModelScan)

```bash
curl -X 'POST' \
    'http://localhost:3311/scan/file' \
    -H 'Accept: application/json' \
    -H 'Content-Type: multipart/form-data' \
    -F 'in_file=@yolo.onnx'
```

- Files are temporarily written to disk.
- Pickle files are validated to reduce false positives.
- Maximum file size: **4GB**.

### Image Layer Scanning (Trivy)

```bash
bash curl -X POST \
    http://localhost:3311/scan/image \
    -H "Accept: application/json" \
    -H "Content-Type: multipart/form-data" \
    -F "in_file=@<sha256>"
```

- Blob digest is verified before scanning.
- SBOMs are cached by digest.
- Vulnerability scans are performed offline against the local Trivy DB.
- Database updates are triggered automatically when stale.

## Configuration

Configuration is via environment variables or a `.env` file. Refer to [FastAPI's env file docs](https://fastapi.tiangolo.com/advanced/settings/#reading-a-env-file) for formatting.

Example `.env`:

```env
API_KEY=yourapikey
```

## Development

The following steps are only required for users who wish to extend or develop the API locally.

### Local Python Setup

From within the `lib/artefactscan_api` directory:

```bash
python3 -m venv artefactscanvenv
source artefactscanvenv/bin/activate
pip install -r requirements-dev.txt
```

### Developer Mode via Docker

```bash
docker build -t artefactscan_rest_api:latest --target dev .
docker run -v ./bailo_artefactscan_api:/app/bailo_artefactscan_api -p 0.0.0.0:3311:3311 artefactscan_rest_api:latest
```

- Hot reload enabled
- Trivy binary included in container

### Testing

```bash
pytest
```

To run the integration tests (does not require any externally running services):

```bash
pytest -m integration
```

> **Note:** the integration tests use safe but technically "malicious" file(s) to check ArtefactScan's performance. Please
refer to [test_integration](./tests/test_integration/README.md) for details.

## Docker Build Stages

The [Dockerfile](./Dockerfile) has two build targets:

- `dev` - mounts source code for live changes
- `prod` - optimised for deployment (default target)

## ArtefactScan vs ModelScan API

The **ArtefactScan API** replaces the previous standalone **ModelScan API**.

- The earlier ModelScan API only supported file scanning via ProtectAI ModelScan.
- ArtefactScan expands this scope to support multiple scanner types behind a single service.
- Trivy integration for container image layer scanning and SBOM generation is only available via ArtefactScan.
- ModelScan remains supported as a scanner, but is no longer exposed as a standalone API.
- The [old GHCR `bailo_modelscan` image repository](https://github.com/gchq/Bailo/pkgs/container/bailo_modelscan) still exists for reference but **will not receive further updates**.

Consumers should migrate to ArtefactScan for all artefact scanning use cases.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[license-shield]: https://img.shields.io/github/license/gchq/bailo.svg?style=for-the-badge
[license-url]: https://github.com/gchq/Bailo/blob/main/LICENSE.txt
[code-of-conduct-shield]: https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=for-the-badge
[code-of-conduct-url]: https://github.com/gchq/Bailo/blob/main/CODE_OF_CONDUCT.md
