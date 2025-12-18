# Bailo Python Client

[![PyPI - Python Version][pypi-python-version-shield]][pypi-url] [![PyPI - Version][pypi-version-shield]][pypi-url]
[![License][license-shield]][license-url] [![Contributor Covenant][code-of-conduct-shield]][code-of-conduct-url]

A lightweight, Python API wrapper for Bailo, providing streamlined programmatic access to its core functionality - designed for Data Scientists, ML Engineers, and Developers who need to integrate Bailo capabilities directly into their workflows.

<br />

<!-- TABLE OF CONTENTS -->
<details>
    <summary>Table of Contents</summary>
    <ol>
        <li>
            <a href="#quickstart">Quickstart</a>
            <ul>
                <li><a href="#installation">Installation</a></li>
                <li><a href="#basic-usage">Basic Usage</a></li>
                <li><a href="#core-features">Core Features</a></li>
            </ul>
        </li>
        <li>
            <a href="#documentation">Documentation</a>
            <ul>
                <li><a href="#building-locally">Building Locally</a></li>
            </ul>
        </li>
        <li>
            <a href="#development">Development</a>
            <ul>
                <li><a href="#python-setup">Python Setup</a></li>
                <li><a href="#running-tests">Running Tests</a></li>
            </ul>
        </li>
    </ol>
</details>

<br />

## Quickstart

> **Requires:** Python 3.9 to 3.13

### Installation

```bash
pip install bailo
```

Optional: enable integration with [MLFlow](https://mlflow.org/) for advanced model tracking:

```bash
pip install bailo[mlflow]
```

### Basic Usage

```python
from bailo import Client, Model

# Connect to Bailo server
client = Client("http://localhost:8080")

# Create a model
yolo = Model.create(
    client=client,
    name="YoloV4",
    description="You only look once!"
)

# Populate datacard using a predefined schema
yolo.card_from_schema("minimal-general-v10")

# Create a new release
my_release = yolo.create_release(
    version="0.1.0",
    notes="Beta"
)

# Upload a binary file to the release
with open("yolo.onnx") as f:
    my_release.upload("yolo", f)
```

### Core Features

- Upload and download model binaries
- Manage Models & Releases
- Handle Datacards & Schemas
- Manage Schemas
- Process Access Requests

> **Note:** Certain collaborative actions (approvals, review threads, etc.) are best handled via the Bailo web interface.

## Documentation

Full Python client documentation: [Bailo Python Docs](https://gchq.github.io/Bailo/docs/python/index.html).

### Building locally

Refer to [backend/docs/README.md](https://github.com/gchq/Bailo/blob/main/backend/docs/README.md) for local build steps.

## Development

The following steps are only required for users who wish to extend or develop the Bailo Python client locally.

### Python Setup

From within the `lib/python` directory:

```bash
python3 -m venv libpythonvenv
source libpythonvenv/bin/activate
pip install -e .[test]
```

### Running Tests

To run the unit tests:

```bash
pytest
```

To run the integration tests (requires Bailo running on `https://localhost:8080`):

```bash
pytest -m integration
```

To run the mlflow integration tests (requires Bailo running on `https://localhost:8080` and mlflow running on `https://localhost:5050` e.g. via docker):

```bash
docker run -p 5050:5000 \
    "ghcr.io/mlflow/mlflow:v$(python -m pip show mlflow | awk '/Version:/ {print $2}')" \
    mlflow server --host 0.0.0.0 --port 5000

pytest -m mlflow
```

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[pypi-url]: https://pypi.org/project/bailo/
[pypi-version-shield]: https://img.shields.io/pypi/v/bailo?style=for-the-badge
[pypi-python-version-shield]: https://img.shields.io/pypi/pyversions/bailo?style=for-the-badge
[license-shield]: https://img.shields.io/github/license/gchq/bailo.svg?style=for-the-badge
[license-url]: https://github.com/gchq/Bailo/blob/main/LICENSE.txt
[code-of-conduct-shield]: https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=for-the-badge
[code-of-conduct-url]: https://github.com/gchq/Bailo/blob/main/CODE_OF_CONDUCT.md
