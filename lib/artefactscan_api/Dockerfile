# syntax=docker/dockerfile:1

ARG UID=65532
ARG GID=65532

FROM ghcr.io/astral-sh/uv:0.13.4@sha256:9f130421e930bfbdc563c00740466603f8723158e90297d07957c2294640262b AS uv

FROM python:3.15.0-slim-trixie@sha256:f5b92f2a669a4c347044f29367f31983280b648250ca94dea66f98c53bc87e58 AS build

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


FROM python:3.15.0-slim-trixie@sha256:f5b92f2a669a4c347044f29367f31983280b648250ca94dea66f98c53bc87e58 AS base
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

FROM aquasec/trivy:0.76.0@sha256:2416d1f74045b57274df1a340eee6b510cacd73c66a6ccb8da092b117eb7d222 AS trivy

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
