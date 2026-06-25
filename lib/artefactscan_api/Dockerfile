# syntax=docker/dockerfile:1

ARG UID=65532
ARG GID=65532

FROM python:3.12.13-slim-trixie AS build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/venv \
    PATH="/venv/bin:$PATH"

WORKDIR /build

# Create virtual environment and upgrade packaging tooling
RUN python -m venv ${VIRTUAL_ENV} && \
    pip install --upgrade pip setuptools wheel

# Install Python dependencies with pip cache
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-compile -r requirements.txt


FROM python:3.12.13-slim-trixie AS base
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

FROM aquasec/trivy:0.71.2 AS trivy

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
