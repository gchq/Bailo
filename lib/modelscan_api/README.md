# ModelScan REST API

![Python](https://img.shields.io/badge/python-3.9%20|%203.10%20|%203.11%20|%203.12-blue.svg?style=for-the-badge)
![Python](https://img.shields.io/badge/version-1.0.0-orange.svg?style=for-the-badge)
[![License][license-shield]][license-url] [![Contributor Covenant][code-of-conduct-shield]][code-of-conduct-url]

This directory provides all of the necessary functionality to interact with
[ModelScan](https://github.com/protectai/modelscan/tree/main) as a REST API.

> ModelScan is an open source project from
> [Protect AI](https://protectai.com/?utm_campaign=Homepage&utm_source=ModelScan%20GitHub%20Page&utm_medium=cta&utm_content=Open%20Source)
> that scans models to determine if they contain unsafe code. It is the first model scanning tool to support multiple
> model formats. ModelScan currently supports: H5, Pickle, and SavedModel formats. This protects you when using PyTorch,
> TensorFlow, Keras, Sklearn, XGBoost, with more on the way.

This API is used as a filescanner and is not published to PyPI.

## Docker

Two Docker files exist - [Dockerfile.dev for development](./Dockerfile.dev) and
[Dockerfile for deployment](./Dockerfile). These make deployment and running of the ModelScan REST API simpler. These
Docker images are used by the docker compose files in the root of the project.

Note that the Docker containers run on port `3311` rather than `8000`, so adjust URLs accordingly.

## Setup

<!-- prettier-ignore-start -->
> [!IMPORTANT]
> Python 3.9 to 3.12 is required
<!-- prettier-ignore-end -->

Create and activate a virtual environment

```bash
python3 -m venv modelscan-venv
source modelscan-venv/bin/activate
```

Install the required pip packages

```bash
pip install -r requirements.txt
```

## Usage

Optionally, create and populate a `.env` file to override and set any [Settings](./bailo_modelscan_api/config.py)
variables, including sensitive properties as per
[FastAPI's Reading a .env file docs](https://fastapi.tiangolo.com/advanced/settings/#reading-a-env-file).

Run:

```bash
fastapi run bailo_modelscan_api/main.py
```

Connect via the local endpoint: `http://127.0.0.1:8000`

View the swagger docs: `http://127.0.0.1:8000/docs`

## Development

### Install dev packages

If already working on Bailo you may be prompted to overwrite Husky. Follow the instructions given by Git CLI.

```bash
pip install -r requirements-dev.txt
pre-commit install
```

### Tests

To run the unit tests:

```bash
pytest
```

To run the integration tests (does not require any externally running services):

```bash
pytest -m integration
```

Note that the integration tests use safe but technically "malicious" file(s) to check ModelScan's performance. Please
refer to [test_integration](./tests/test_integration/README.md) for details.

### Running

To run in [dev mode](https://fastapi.tiangolo.com/fastapi-cli/#fastapi-dev):

```bash
fastapi dev bailo_modelscan_api/main.py
```

Alternatively, build and run [Dockerfile.dev](./Dockerfile.dev) which mounts the `bailo_modelscan_api` directory as a
volume, so allows for real-time changes with FastAPI running in dev mode.

```bash
docker build -t modelscan_rest_api:latest -f ./Dockerfile.dev .
docker run -v ./bailo_modelscan_api:/app/bailo_modelscan_api -p 0.0.0.0:3311:3311 modelscan_rest_api:latest
```

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[license-shield]: https://img.shields.io/github/license/gchq/bailo.svg?style=for-the-badge
[license-url]: https://github.com/gchq/Bailo/blob/main/LICENSE.txt
[code-of-conduct-shield]: https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=for-the-badge
[code-of-conduct-url]: https://github.com/gchq/Bailo/blob/main/CODE_OF_CONDUCT.md
