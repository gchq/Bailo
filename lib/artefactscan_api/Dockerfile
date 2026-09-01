# syntax=docker/dockerfile:1

ARG UID=65532
ARG GID=65532

FROM python:3.12.14-slim-trixie@sha256:e5c9fa26ffb76e11e0f054f30dc2523a2f9693f0c36c0cf1e39b27e152d899fc AS build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/venv \
    PATH="/venv/bin:$PATH"

WORKDIR /build

# Create virtual environment and upgrade packaging tooling
RUN python -m venv ${VIRTUAL_ENV} && \
    pip install --upgrade pip setuptools wheel

# Install Python dependencies with pip cache
COPY pyproject.toml .
COPY bailo_artefactscan_api/__init__.py bailo_artefactscan_api/__init__.py
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-compile .


FROM python:3.12.14-slim-trixie@sha256:e5c9fa26ffb76e11e0f054f30dc2523a2f9693f0c36c0cf1e39b27e152d899fc AS base
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

FROM aquasec/trivy:0.74.0@sha256:62b1e65e8869bc4b4c6aa4fa2b21595256c7c2f6018a9d9ad61caf87187c1969 AS trivy

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
