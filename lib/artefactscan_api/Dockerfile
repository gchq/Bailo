# syntax=docker/dockerfile:1

ARG UID=65532
ARG GID=65532

FROM python:3.12.13-slim-trixie@sha256:57cd7c3a7a273101a6485ba99423ee568157882804b1124b4dd04266317710de AS build

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


FROM python:3.12.13-slim-trixie@sha256:57cd7c3a7a273101a6485ba99423ee568157882804b1124b4dd04266317710de AS base
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

FROM aquasec/trivy:0.72.0@sha256:cffe3f5161a47a6823fbd23d985795b3ed72a4c806da4c4df16266c02accdd6f AS trivy

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
