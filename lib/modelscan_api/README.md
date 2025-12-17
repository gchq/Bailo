# ModelScan REST API

![Python](https://img.shields.io/badge/python-3.10%20|%203.11%20|%203.12-blue.svg?style=for-the-badge)
![Python](https://img.shields.io/badge/version-1.0.0-orange.svg?style=for-the-badge)
[![License][license-shield]][license-url] [![Contributor Covenant][code-of-conduct-shield]][code-of-conduct-url]

This directory provides all of the necessary functionality to interact with
[ModelScan](https://github.com/protectai/modelscan/tree/main) as a REST API.

> ModelScan is an open source project from
> [Protect AI](https://protectai.com/?utm_campaign=Homepage&utm_source=ModelScan%20GitHub%20Page&utm_medium=cta&utm_content=Open%20Source)
> that scans models to determine if they contain unsafe code. It is the first model scanning tool to support multiple
> model formats. ModelScan currently supports: H5, Pickle, and SavedModel formats. This protects you when using PyTorch,
> TensorFlow, Keras, Sklearn, XGBoost, with more on the way.

This API is used as a file scanner and is not published to PyPI. The built image is published to
[GHCR bailo_modelscan](https://github.com/gchq/Bailo/pkgs/container/bailo_modelscan).

## Quickstart

> **Requires:** Python 3.10 to 3.12, Docker

### Build and Run via Docker

This is the fastest way to get ModelScan REST API running.

```bash
docker build -t modelscan_rest_api:latest .
docker run -p 0.0.0.0:3311:3311 modelscan_rest_api:latest
```

> **Note:** API runs on **port 3311**, not 8000. Adjust requests accordingly.

### Connect to the API

- Local endpoint: `http://localhost:3311`
- API docs (Swagger): `http://localhost:3311/docs`

## Optional Configuration

You can override default settings by creating a `.env` file. This is useful for sensitive or environment-specific properties. Refer to [FastAPI's env file docs](https://fastapi.tiangolo.com/advanced/settings/#reading-a-env-file) for formatting.

Example `.env`:

```env
API_KEY=yourapikey
```

## Development

The following steps are only required for users who wish to extend or develop the API locally.

### Python setup

```bash
python3 -m venv modelscanvenv
source modelscanvenv/bin/activate
pip install -r requirements-dev.txt
```

### Developer Mode via Docker

This mode mounts your source code for real-time changes.

```bash
docker build -t modelscan_rest_api:latest --target dev .
docker run -v ./bailo_modelscan_api:/app/bailo_modelscan_api -p 0.0.0.0:3311:3311 modelscan_rest_api:latest
```

Alternatively, run locally without Docker:

```bash
fastapi dev --port 3311 bailo_modelscan_api/main.py
```

### Running Tests

To run the unit tests:

```bash
pytest
```

To run the integration tests (does not require any externally running services):

```bash
pytest -m integration
```

> **Note:** the integration tests use safe but technically "malicious" file(s) to check ModelScan's performance. Please
refer to [test_integration](./tests/test_integration/README.md) for details.

## Docker Build Stages

The [Dockerfile](./Dockerfile) has two build targets:

- `dev` - mounts source code for live changes
- `prod` - optimised for deployment (default target)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[license-shield]: https://img.shields.io/github/license/gchq/bailo.svg?style=for-the-badge
[license-url]: https://github.com/gchq/Bailo/blob/main/LICENSE.txt
[code-of-conduct-shield]: https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=for-the-badge
[code-of-conduct-url]: https://github.com/gchq/Bailo/blob/main/CODE_OF_CONDUCT.md
