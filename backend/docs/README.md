# Bailo Python Client Documentation

The documentation for [a simple Python API Wrapper for Bailo](../../lib/python/README.md)

<br />

<!-- TABLE OF CONTENTS -->
<details>
    <summary>Table of Contents</summary>
    <ol>
        <li>
            <a href="#documentation">Documentation</a>
            <ul>
                <li>
                    <a href="#building-locally">Building locally</a>
                    <ul>
                        <li><a href="#prerequisites">Prerequisites</a></li>
                        <li><a href="#building">Building</a></li>
                    </ul>
                </li>
            </ul>
        </li>
    </ol>
</details>

<br />

## Documentation

Documentation is rendered with Sphinx and served [here](https://gchq.github.io/Bailo/docs/python/index.html).

### Building locally

<!-- prettier-ignore-start -->
> [!IMPORTANT]
> Python 3.8.1 or higher is required
<!-- prettier-ignore-end -->

#### Prerequisites

From within the `backend/docs` directory:

```bash
pip install bailo -r requirements.txt
apt install -y pandoc
```

#### Building

From the docs directory run either `make html` (Linux & Mac) or `make.bat` (Windows). This will build it in the backend
directory by default.
