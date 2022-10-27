from setuptools import setup

setup(
    name="bailoclient",
    version="0.1.0",
    description="A python client for interacting with the Bailo model management platform",
    packages=["bailoclient"],
    install_requires=[
        "pytest >= 6.2",
        "pydantic >= 1.8",
        "requests >= 2.25.1",
        "boto3 >= 1.17.109",
        "warrant >= 0.6.1",
        "PyYAML >= 5.4.1",
        "munch >= 2.5.0",
        "requests-toolbelt >= 0.9.1",
        "requests-pkcs12 >= 1.13",
        "jsonschema >= 3.2.0",
        "python-dotenv >= 0.20.0",
    ],
    extras_require={
        "dev": [
            "black[jupyter]",
            "pylint",
            "pre-commit",
        ],
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
