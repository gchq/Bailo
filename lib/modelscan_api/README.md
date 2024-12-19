# ModelScan

This directory provides all of the necessary functionality to interact with
[modelscan](https://github.com/protectai/modelscan/tree/main) as a REST API.

> ModelScan is an open source project from
> [Protect AI](https://protectai.com/?utm_campaign=Homepage&utm_source=ModelScan%20GitHub%20Page&utm_medium=cta&utm_content=Open%20Source)
> that scans models to determine if they contain unsafe code. It is the first model scanning tool to support multiple
> model formats. ModelScan currently supports: H5, Pickle, and SavedModel formats. This protects you when using PyTorch,
> TensorFlow, Keras, Sklearn, XGBoost, with more on the way.

## Setup

Note that **Python 3.9 to 3.12** is required.

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

Create and populate a `.env` file to override and set any variables, including sensitive properties.

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
