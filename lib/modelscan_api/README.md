# ModelScan

This directory provides all of the necessary functionality to interact with
[modelscan](https://github.com/protectai/modelscan/tree/main) as an API.

> ModelScan is an open source project from
> [Protect AI](https://protectai.com/?utm_campaign=Homepage&utm_source=ModelScan%20GitHub%20Page&utm_medium=cta&utm_content=Open%20Source)
> that scans models to determine if they contain unsafe code. It is the first model scanning tool to support multiple
> model formats. ModelScan currently supports: H5, Pickle, and SavedModel formats. This protects you when using PyTorch,
> TensorFlow, Keras, Sklearn, XGBoost, with more on the way.

## Setup

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

### Install and add pre-commit

If already working on Bailo you may be prompted to overwrite Husky. Follow the instructions given by Git CLI.

```bash
pip install pre-commit
pre-commit install
```

To run in dev mode:

```bash
fastapi dev bailo_modelscan_api/main.py
```
