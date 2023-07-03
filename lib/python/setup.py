from setuptools import setup

setup(
    name="bailoclient",
    version="0.1.0",
    description="A python client for interacting with the Bailo model management platform",
    packages=["bailoclient"],
    install_requires=[
        "boto3 <= 1.17.109",
        "jsonschema <= 3.2.0",
        "munch <= 2.5.0",
        "pipreqs <= 0.4.13",
        "pipreqsnb <= 0.2.4",
        "pycognito <= 2022.12.0",
        "pydantic <= 1.8",
        "python-dotenv <= 0.20.0",
        "PyYAML <= 5.4.1",
        "requests <= 2.25.1",
        "requests-pkcs12 <= 1.13",
        "requests-toolbelt <= 0.9.1",
    ],
    extras_require={
        "dev": [
            "black[jupyter]",
            "pre-commit",
            "pylint",
            "pytest >= 6.2",
            "sphinx >= 5.3.0",
            "m2r2 >= 0.3.1",
            "myst-nb >= 0.17.2",
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
