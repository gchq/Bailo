# Security Policy

## Supported versions

We provide security fixes for the latest release and the `main` branch. Patches will be added to the latest version of
Bailo. It is therefore important that you make sure your environment is up to date with the latest release.

## Reporting a vulnerability

**Do not report security vulnerabilities through public GitHub issues, pull requests or discussions.**

Report them privately at [Report a vulnerability](https://github.com/gchq/Bailo/security/advisories/new).

Include:

- A description of the vulnerability and its potential impact
- The affected component, version or commit
- Steps to reproduce, or a proof of concept

## Scope

In scope:

- The backend API (`backend/`) and the frontend application (`frontend/`)
- The Python client library (`lib/python/`)
- The ArtefactScan API (`lib/artefactscan_api/`)
- The Helm charts (`infrastructure/`) and Docker Compose files

Out of scope:

- Vulnerabilities in third-party dependencies with no demonstrable impact on Bailo (report these upstream)
- Findings from automated scanners without a proof of concept or a clear description of the impact
- Denial of service
- Social engineering, physical attacks, or issues requiring access to a deployer's own infrastructure or secrets
- Insecure configuration in a deployment, such as default credentials you have not changed
