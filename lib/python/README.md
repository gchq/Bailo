# Python client

## Installation

---

### Developers

```bash
python3 -m pip install -r requirements.txt
pre-commit install
```

### Users

```bash
python3 -m pip install -e .
```

> #### Note
>
> You may need to install some additional requirements for
> [pycryptodome](https://pycryptodome.readthedocs.io/en/latest/src/installation.html) e.g. on Linux:
>
> ```bash
> sudo yum install gcc gmp python3-devel
> ```

## Environment

You will need to create a [.env](https://pypi.org/project/python-dotenv/#getting-started) file at the root of the
project as per the [example.env](./examples/resources/example.env) with the following parameters:

**AWS_GATEWAY**

> TRUE if you are running on AWS as there is a size limit to the data upload

Add the authentication credentials if you are using Cognito for authentication.

## Authentication

---

There are three different types of authentication:

### Cognito

---

You will need to add the additional authentication credentials in your .env file. Parameters should be as follows:

**COGNITO_USERPOOL**

> The Cognito userpool ID
>
> Cognito -> user pools -> user pool ID

**COGNITO_CLIENT_ID and COGNITO_CLIENT_SECRET**

> The app client ID and secret
>
> Cognito -> user pools -> pool name -> app integration -> app client name -> app client ID / show client secret

**COGNITO_REGION**

> eu-west-2

**BAILO_URL**

> Bailo API URL, e.g. http://localhost:8080/api/v1

**COGNITO_USERNAME and COGNITO_PASSWORD**

> Your Cognito credentials

### PKI

---

This example assumes the user will enter the certificate password manually so that the password is not stored on disk.

You will need a CA file and a P12 file for authentication. The filepaths should be passed to the client.

**P12_FILE**

> Path to p12 file

**CA_FILE**

> Path to CA file

**BAILO_URL**

> URL of BAILO instance

### Null auth

---

If authentication is not required you can use MockAuthentication()

## Testing

To run the tests, run the following from the top-level directory of the Bailo Client (Bailo/lib/python):

```bash
make test
```

To run the end-to-end tests:

```bash
make e2e-test
```

## Example usage

It is recommended that you use the BAILO interface for interacting with the BAILO client.

### Using PKI

```python
from bailoclient import Bailo

bailo = Bailo(pki_p12='path/to/p12',
                pki_ca='path/to/ca',
                bailo_url='http://localhost:8080/api/v1'
            )

bailo.get_my_models()
```

You will be prompted for your certificate password before you can connect.

### Using Cognito

```python
from bailoclient import Bailo

bailo = Bailo(cognito_user_pool_id="eu-west-2_xx1xxx1xx",
                cognito_client_id="1xx1x1x111xxxxxx1xxxxxx1xx",
                cognito_client_secret="1xx1x1xxxxxx111x1xx111xxxxxxxx111xxx1xxx1xx111xx11x",
                cognito_region="eu-west-2",
                bailo_url="http://localhost:8080/api/v1",
                cognito_username="username",
                cognito_pwd="password"
            )

bailo.get_my_models()

```

### Using a .env file

With a .env file configured you can create your bailo instance with no config.

```python
from bailoclient import Bailo

bailo = Bailo()

bailo.get_my_models()

```

There are example files for interacting directly with the BAILO library at:

- [bailo-demo.ipynb](./examples/bailo-demo.ipynb) (no authentication)

- [cognito_auth](./examples/cognito_client.py)

- [pki_auth](./examples/pki_client.py)
