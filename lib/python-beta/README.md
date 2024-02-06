# Bailo Python Client

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
            <a href="#development">Development</a>
            <ul>
                <li><a href="#install-and-add-precommit">Precommits</a></li>
                <li><a href="#testing">Testing</a></li>
            </ul>
        </li>
    </ol>
</details>

<br />

## Key Features

- Uploading and downloading model binaries

## Installing

**Python 3.8.1 or higher is required**

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
    description="You only look once!",
    team_id="Uncategorised"
)

yolo.card_from_schema("minimal-general-v10-beta")

# Create a new release
my_release = yolo.create_release(version="0.1.0",
                              notes="Beta")

# Upload a file to the release
with open("yolo.onnx") as f:
    my_release.upload("yolo", f)
```

## Documentation

Documenation is rendered with Sphinx and served [here](https://gchq.github.io/Bailo/docs/python/index.html).

### Building locally

From the docs directory run either `make html` or `make.bat` on Windows. This will build it in the backend directory by
default.

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
