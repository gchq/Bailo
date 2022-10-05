# Python client

## Installation

---

### Developers

```
python3 -m pip install -r requirements.txt
pre-commit install
```

### Users

```
python3 -m pip install -e .
```

> #### Note
>
> You may need to install some additional requirements for
> [pycryptodome](https://pycryptodome.readthedocs.io/en/latest/src/installation.html) e.g. on Linux:
>
> ```
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

**USERPOOL**

> The Cognito userpool ID
>
> Cognito -> user pools -> user pool ID

**CLIENT_ID and CLIENT_SECRET**

> The app client ID and secret
>
> Cognito -> user pools -> pool name -> app integration -> app client name -> app client ID / show client secret

**REGION**

> eu-west-2

**URL**

> Bailo API URL, e.g. http://localhost:8080/api/v1

**USERNAME and PASSWORD**

> Your Cognito credentials

### PKI

---

This example assumes the user will enter the certificate password manually so that the password is not stored on disk.

### Null auth

---

If authentication is not required you can use MockAuthentication()

## Examples

- [bailo-demo.ipynb](./examples/bailo-demo.ipynb) (no authentication)

- [cognito_auth](./examples/cognito_client.py)

- [pki_auth](./examples/pki_client.py)

## Testing

To run the tests, run the following from the top-level directory of the Bailo Client (Bailo/lib/python):

```
make test
```

To run the end-to-end tests:

```
make e2e-test
```
