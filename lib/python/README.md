# Bailo Python Client

[![PyPI - Python Version][pypi-python-version-shield]][pypi-url] [![PyPI - Version][pypi-version-shield]][pypi-url]
[![License][license-shield]][license-url] [![Contributor Covenant][code-of-conduct-shield]][code-of-conduct-url]

A simple Python API Wrapper for Bailo

<br />

<!-- TABLE OF CONTENTS -->
<details>
    <summary>Table of Contents</summary>
    <ol>
        <li>
            <a href="#key-features">Key Features</a>
        </li>
        <li>
            <a href="#installing">Installing</a>
        </li>
        <li>
            <a href="#getting-started">Getting Started</a>
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
                <li><a href="#install-and-add-precommit">Install and add precommit</a></li>
                <li><a href="#install-the-package-locally">Install the package locally</a></li>
                <li><a href="#testing">Testing</a></li>
            </ul>
        </li>
    </ol>
</details>

<br />

## Key Features

- Uploading and downloading model binaries
- Managing Models and Releases
- Managing Datacards
- Managing Schemas
- Managing Access Requests

The Bailo Python client aims to programmatically cover Bailo's core functionality by interacting with the endpoints in
the backend. The functionality covered is that which a Data Scientist, Software Engineer or other similarly technical
role might be expected to utilise, meaning that it does _not_ have complete coverage of all endpoints, such as those
relating to the discussion & approval of reviews & access requests. For these interactions, the web frontend is expected
to be used.

## Installing

<!-- prettier-ignore-start -->
> [!IMPORTANT]
> Python 3.9 or higher is required
<!-- prettier-ignore-end -->

```bash
pip install bailo
```

## Getting Started

```python
from bailo import Client, Model
client = Client("http://localhost:8080")

# Create a model
yolo = Model.create(
    client=client,
    name="YoloV4",
    description="You only look once!"
)

yolo.card_from_schema("minimal-general-v10")

# Create a new release
my_release = yolo.create_release(version="0.1.0",
                                 notes="Beta")

# Upload a file to the release
with open("yolo.onnx") as f:
    my_release.upload("yolo", f)
```

## Documentation

Documentation is rendered with Sphinx and served [here](https://gchq.github.io/Bailo/docs/python/index.html).

### Building locally

Refer to [backend/docs/README.md](../../backend/docs/README.md) for local build steps.

## Development

### Install and add precommit

If already working on Bailo you may be prompted to overwrite Husky. Follow the instructions given by Git CLI.

```bash
pip install pre-commit
pre-commit install
```

### Install the package locally

```bash
pip install -e .
```

### Testing

The package uses Pytest to test packages. Tests can be ran accordingly from within this directory. Tests are split into
categories sections for automation purposes.

In order to run integration tests make sure Bailo is running on `https://localhost:8080`:

```bash
pytest -m integration
```

Run all other tests:

```bash
pytest
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
