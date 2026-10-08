# syntax=docker/dockerfile:1

ARG UID=65532
ARG GID=65532

FROM ghcr.io/astral-sh/uv:0.12.8@sha256:d1cbaeadc234fe19c0d93daabcf5e98738cd93c6d1dd4918ef6aa30735feb23a AS uv

FROM python:3.12.14-slim-trixie@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f AS build

COPY --from=uv /uv /bin/uv

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/venv \
    PATH="/venv/bin:$PATH" \
    UV_PROJECT_ENVIRONMENT=/venv \
    UV_COMPILE_BYTECODE=0 \
    UV_LINK_MODE=copy

WORKDIR /build

# `--no-install-project` keeps layer cached against dependency changes only
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev --no-install-project

# `--no-deps` as uv sync already installed the lock
COPY pyproject.toml ./
COPY bailo_artefactscan_api ./bailo_artefactscan_api
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --no-deps .


FROM python:3.12.14-slim-trixie@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f AS base
ARG UID
ARG GID

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/venv \
    PATH="/venv/bin:$PATH"

# Create non-root runtime user
RUN groupadd --gid ${GID} appuser && \
    useradd --uid ${UID} --gid ${GID} -M --shell /usr/sbin/nologin appuser

WORKDIR /app

FROM aquasec/trivy:0.75.0@sha256:af6acf9a6b85dfe389a1941505c0ce9efef52a4719635e1a962f022a3d855daa AS trivy

FROM base AS dev

COPY --from=build /venv /venv
COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy
# Ensure app dir exists before mounting
RUN mkdir -p /app/bailo_artefactscan_api

CMD ["fastapi", "dev", "bailo_artefactscan_api/main.py", "--host", "0.0.0.0", "--port", "3311"]

FROM base AS prod
ARG UID
ARG GID

COPY --from=build --chown=${UID}:${GID} /venv /venv
COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy
# Copy application files
COPY --chown=${UID}:${GID} bailo_artefactscan_api /app/bailo_artefactscan_api
# Run as non-root
USER ${UID}:${GID}

CMD ["fastapi", "run", "bailo_artefactscan_api/main.py", "--port", "3311"]
