# Bailo Python Client

## Installation

### Dependencies

This library requires some additional requirements to build [pycryptodome](https://pycryptodome.readthedocs.io/en/latest/src/installation.html).

```bash
# RPM / Fedora Based
sudo yum install gcc gmp python3-devel

# Ubuntu
sudo apt-get install build-essential python3-dev
```

### Installation

```bash
python3 -m pip install .
```

## Documentation

Install dev dependencies and build the documentation

```bash
python3 -m pip install -r requirements.txt
cd docs
make html
```

To view the docs open `docs/build/html/index.html` in your browser.

## Authentication

Multiple types of authentication are supported, each needing a config object:

### Cognito

```python
from bailoclient import CognitoConfig

config = CognitoConfig(
    username="username",
    password="password",
    user_pool_id="user-pool-id",
    client_id="client-id",
    client_secret="secret",
    region="region",
)
```

### PKI

```python
from bailoclient import Pkcs12Config

config = Pkcs12Config(
    pkcs12_filename="path/to/file.pem",
    pkcs12_password="password"
)
```

> If you don't want to expose your password use `bailoclient.create_pki_client`

### Null auth

If your Bailo instance is not configured with access control (not recommended), simply use `None`

```python
config = None
```

### Loading Authentication config from environment variables

```python
from bailoclient import CognitoConfig, Pkcs12Config

config = CognitoConfig.from_env()
config = Pkcs12Config.from_env()
```

Please refer to the documentation for environment variables needed by each config type.


## Client

There are two ways to interact with a Bailo instance:

### `bailoclient.Client` Example

This class makes available all the functionality to interact with your bailo instance. There are three client creation function available to quickly create a `bailoclient.Client` instance.

```python
from bailoclient import create_pki_client

client = create_pki_client(
    p12_file="path/p12/file.pem",
    bailo_url="https://bailo.io"
)

client.get_my_models()
```

### `bailoclient.Bailo` Example

This class has all the functionality of `bailoclient.client` with additional functionality to improve the user experience for data scientists.
Additional functionality includes making the model bundlers available and generating requirements files for your models.

```python
from bailoclient import Bailo, BailoConfig, Pkcs12Config

auth = Pkcs12Config(...)
bailo = Bailo(
    config=BailoConfig(
        auth=auth,
        bailo_url="https://bailo.io",
        ca_cert="path/to/ca",
    )
)

bailo.get_my_models()
```

### Loading a config from environment variables:

Please refer to the documentation for environment variables needed by each config type.

```python
from bailoclient import Bailo, BailoConfig, AuthType

config = BailoConfig.from_env(auth_type=AuthType.PKI) # or AuthType.PKI, AuthType.NULL
bailo = Bailo(config)

bailo.get_my_models()
```

### Saving and Loading Bailo Config

```python
from bailoclient import Bailo, BailoConfig, Pkcs12Config

auth = Pkcs12Config(...)
config=BailoConfig(
    auth=auth,
    bailo_url="https://bailo.io",
    ca_cert="path/to/ca",
)
config.save(config_path="./bailo-config.yaml")

bailo = Bailo(config=BailoConfig.load("./bailo-config.yaml"))
bailo.get_my_models()
```

## Examples

There are example files for interacting directly with the BAILO library at:

- [bailo-demo.ipynb](./examples/bailo-demo.ipynb) (no authentication)

## Development

### Install dependencies

```bash
python3 -m pip install -r requirements.txt
pre-commit install
```

### Creating an environment with conda

If you have anaconda or miniconda installed an environment can be created by:

```bash
conda create -n bailo python=3.10
conda activate bailo
pip install -r requirments.txt
```

### Creating an environment with venv

This requires and existing python installation and pip installed:

```bash
python3 -m venv venv
venv/bin/activate
pip install -r requirements.txt
```

### Running Tests

To run the tests, run the following from the top-level directory of the Bailo Client `Bailo/lib/python`:

```bash
make test
```

To run the end-to-end tests:

```bash
make e2e-test
```
