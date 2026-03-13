# Bailo Python Client Documentation

[Bailo Python Client](../../lib/python/README.md) documentation. Full Python client documentation: [Bailo Python Docs](https://gchq.github.io/Bailo/docs/python/index.html).

<br />

<!-- TABLE OF CONTENTS -->
<details>
    <summary>Table of Contents</summary>
    <ol>
        <li>
            <a href="#building-locally">Building Locally</a>
            <ul>
                <li><a href="#docker">Docker</a></li>
                <li>
                    <a href="#manual">Manual</a>
                    <ul>
                        <li><a href="#python setup">Python Setup</a></li>
                        <li><a href="#building">Building</a></li>
                    </ul>
                </li>
            </ul>
        </li>
    </ol>
</details>

<br />

## Building Locally

> **Requires:** Python 3.11 to 3.14, Docker or [Pandoc](https://pandoc.org/installing.html)

The following steps are only required for users who wish to extend or develop the documentation package locally.

### Docker

The docs are built and served as part of the `backend` docker image.

### Manual

#### Python Setup

From within the `backend/docs` directory:

```bash
python3 -m venv backenddocsvenv
source backenddocsvenv/bin/activate
pip install bailo -r requirements.txt
```

#### Building

Run either `make html` (Linux & Mac) or `make.bat` (Windows). This will build the docs in the backend directory by default.
