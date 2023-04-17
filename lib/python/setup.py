from setuptools import setup

setup(
    name="bailoclient",
    version="0.1.0",
    description="A python client for interacting with the Bailo model management platform",
    packages=["bailoclient"],
    install_requires=[
        "pydantic >= 1.8",
        "requests >= 2.25.1",
        "boto3 >= 1.17.109",
        "pycognito >= 2022.12.0",
        "PyYAML >= 5.4.1",
        "munch >= 2.5.0",
        "requests-toolbelt >= 0.9.1",
        "requests-pkcs12 >= 1.13",
        "jsonschema >= 3.2.0",
        "python-dotenv >= 0.20.0",
        "pipreqsnb >= 0.4.13",
    ],
    extras_require={
        "dev": [
            "black[jupyter]",
            "pre-commit",
            "pylint",
            "pytest >= 6.2",
        ],
        "bundling": ["mlflow"],
    },
    classifiers=[
        "Development Status :: 2 - Pre-Alpha",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
)
