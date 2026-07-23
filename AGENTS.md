# Bailo Agent Development Guide

## Project

Bailo is a full-stack monorepo for managing the lifecycle of machine learning models - supporting scalability, impact,
collaboration, compliance and sharing. The stack is a TypeScript/Node.js backend (Express), a Next.js/React frontend, a
Python client library, and a Python FastAPI scanning service.

Core principles for changes:

- Always use British English for spellings and terms (e.g. "colour", "organisation", "authorise", "centre", "licence").
- Prefer clear, readable code over clever or compact solutions. Keep functions focused on a single responsibility.
- Avoid new external dependencies unless absolutely necessary. Reuse existing project utilities first.
- Backend follows a layered architecture: routes -> services -> models -> connectors. Respect this separation.
  Connectors use a strategy pattern: a base class in `Base.ts`, concrete implementations (e.g. `clamAv.ts`, `oauth.ts`),
  and an `index.ts` that selects the implementation via `config.connectors.<name>.kind`. Categories: authentication,
  authorisation, audit, artefactScanning, metrics, peer.

## Structure

- **`.`** - monorepo root. Orchestrates backend and frontend builds/tests/lint. Docker Compose quickstart:
  `npm i && docker compose build --parallel && docker compose up -d`.
- **`backend`** - Express 5 API server (TypeScript ESM). Mongoose for MongoDB, Zod for validation, OpenTelemetry for
  observability.
- **`frontend`** - Next.js web application (TypeScript, React, MUI). SWR for data fetching.
- **`lib/landing`** - static Next.js site for GitHub Pages. Run `npm run generate` before `dev` or `build`.
- **`lib/python`** - Python client library (`bailo` on PyPI). Partial API coverage. Has unit and integration tests.
- **`lib/artefactscan_api`** - FastAPI scanning service (ModelScan, Trivy, ClamAV) on port 3311.
- **`infrastructure`** - Helm charts and deployment configuration.

## Commands

Bailo expects Node.js 26 (see `.nvmrc`).

### Root (orchestrates backend + frontend)

- Install all dependencies: `npm i` (also installs backend + frontend via postinstall)
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Format check: `npm run check-style`
- Format fix: `npm run style`
- Generate certs: `npm run certs`
- Cypress E2E (open): `npm run cy:open`
- Cypress E2E (headless): `npm run cy:run`

### Backend (`backend/`)

- Dev server: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Format check: `npm run check-style`
- Run a script: `npm run script`
- Seed database: `npm run seed`

### Frontend (`frontend/`)

- Dev server: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Format check: `npm run check-style`
- Cypress E2E (open): `npm run cy:open`
- Cypress E2E (headless): `npm run cy:run`

### Python client (`lib/python/`)

```bash
python3 -m venv libpythonvenv && source libpythonvenv/bin/activate
pip install -e .[test]
```

- Unit tests: `pytest`
- Integration tests: `pytest -m integration` (requires Bailo running on `https://localhost:8080`)
- MLFlow tests: `pytest -m mlflow`
- Format check: `black --check .`
- Lint: `pylint bailo`

### ArtefactScan API (`lib/artefactscan_api/`)

```bash
python3 -m venv artefactscanvenv && source artefactscanvenv/bin/activate
pip install -r requirements-dev.txt
```

- Unit tests: `pytest`
- Integration tests: `pytest -m integration`
- Docker build & run:
  `docker build -t artefactscan_rest_api:latest . && docker run -p 0.0.0.0:3311:3311 artefactscan_rest_api:latest`

## Coding conventions

### TypeScript/JavaScript

- **Prettier** for formatting: `printWidth: 120`, no semicolons, single quotes, 2-space indent.
- **ESLint** with zero warnings allowed (`--max-warnings=0`).
- ESM imports with `.js` extensions (backend is `"type": "module"`).
- Use **Zod** schemas for request/response validation. Route files export a schema (e.g. `postModelSchema`) used for
  both validation and OpenAPI generation via `@asteasolutions/zod-to-openapi`.
- Use existing error helpers from `backend/src/utils/error.ts`: `BadReq`, `Forbidden`, `NotFound`, `Unauthorized`,
  `Conflict`, `ContentTooLarge`, `UnsatisfiableRange`.
- Use **JSDoc-style** docstrings. Keep them concise (1-2 lines) unless genuinely needed.

### Python

- **Black** for formatting (line-length 120). Do not manually override.
- **pylint** for linting. Follow **PEP 8** where not overridden by Black.
- Use **reStructuredText (reST)** format for docstrings.
- Add inline comments only where the code is non-obvious.

### Punctuation and characters

- Use hyphens (`-`) instead of em dashes or en dashes.
- Use straight double quotes (`"`) instead of curly quotes.
- Use straight apostrophes (`'`) instead of curly apostrophes.
- Use `->` instead of arrow characters (`→`).
- Check copied text from external sources for special characters before committing.

## Testing

Bug fixes require regression tests that fail before the fix and pass after it. New features require tests covering edge
cases and invalid input.

### Backend (Vitest)

- Test files: `backend/test/**/*.spec.ts`, mirroring `src/` structure.
- Route tests use `supertest` with `createFixture()` from `backend/test/testUtils/routes.ts`.
- Heavy use of `vi.mock()` and `vi.hoisted()` for mocking. Use `getTypedModelMock()` from
  `backend/test/testUtils/setupMongooseModelMocks.ts` for Mongoose model mocks.
- Snapshot testing with `expect(res.body).matchSnapshot()`.
- Verify audit connector calls in route tests (e.g. `expect(audit.onDeleteModel).toHaveBeenCalled()`).

### Frontend (Vitest + Cypress)

- Unit tests: `frontend/test/**/*.spec.tsx` using `@testing-library/react`.
- E2E tests: `frontend/cypress/e2e/bailo/` using Cypress with `cypress-axe` for accessibility.

### Python (pytest)

- `lib/python/tests/` - unit tests run by default, integration tests via `pytest -m integration`.
- `lib/artefactscan_api/tests/` - unit and integration tests, uses FastAPI `TestClient`.

## CI checks required for PRs

All PRs to `main` must pass these `.github/workflows/` checks:

1. **Build** - `npm run build` (backend + frontend)
2. **Unit tests** - `npm run test`
3. **Style** - `npm run check-style && npm run lint` (Prettier + ESLint)
4. **Docker image builds** - backend, frontend, artefactscan
5. **CodeQL** - security analysis for JS/TS, Python, and Actions
6. **Kubernetes** - Helm deployment test on minikube
7. **Cypress E2E** - end-to-end browser tests
8. **Python integration** - pytest with integration + mlflow markers

Path-filtered (only run when relevant files change):

9. **Python static checks** - `black --check` + `pylint` (when `lib/python/` changes)
10. **Python unit tests** - pytest across Python 3.10-3.14 (when `lib/python/` changes)
11. **ArtefactScan tests** - pytest (when `lib/artefactscan_api/` changes)
12. **Docs style** - `frontend/scripts/check-docs-style.sh` (when `frontend/pages/docs/**/*.mdx` changes)

## Security

- **Authentication/authorisation**: pluggable connectors in `backend/src/connectors/`. Authorisation uses action-based
  checks (`ModelAction`, `ReleaseAction`, `FileAction`, etc.) with role membership and access request validation.
- **Audit logging**: all mutating operations must call the audit connector. Route tests must verify audit calls.
- **HTTP headers**: Helmet middleware is applied globally in `backend/src/routes.ts`.
- **Body size limits**: JSON parsing defaults to 100kb, raised to 500kb only for specific large-body routes.
- **Scanning**: ClamAV for virus scanning, ModelScan for ML model files, Trivy for container images.

## Contributing

Licensed under Apache 2.0 (see `LICENSE.txt`). See `CONTRIBUTING.md` for full details. Key points:

- Branch off `main` with naming pattern `gh-12345-my-contribution`.
- Sign the GCHQ Contributor Licence Agreement (CLA).
- Ensure Prettier, ESLint, and all tests pass before opening a PR.
- Update relevant documentation for new features or UX changes.
- After approval and all checks pass, the contributor merges their own PR.
