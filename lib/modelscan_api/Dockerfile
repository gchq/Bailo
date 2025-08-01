# syntax=docker/dockerfile:1

ARG PYTHONPATH=/venv/lib/python3.12/site-packages

FROM python:3.12.11-slim-bookworm AS build
ARG PYTHONPATH
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=${PYTHONPATH}

COPY requirements.txt /requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m venv /venv && \
    /venv/bin/pip install --upgrade pip setuptools wheel && \
    /venv/bin/pip install -r /requirements.txt

FROM ubuntu:24.04 AS base
ARG PYTHONPATH
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=${PYTHONPATH}
# Cache packages with run cache, set up nonroot user
# Update system packages, install python3
RUN --mount=type=cache,target=/var/cache/apt --mount=type=cache,target=/var/lib/apt \
    rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    groupadd -g 65532 nonroot && \
    useradd nonroot -u 65532 -g 65532 -M && \
    apt-get update && \
    apt-get install -y --no-install-recommends curl python3 && \
    apt-get dist-upgrade -y

WORKDIR /app
CMD ["python3", "/venv/bin/fastapi", "run", "bailo_modelscan_api/main.py", "--port", "3311"]
FROM base AS dev

COPY --from=build /venv /venv

FROM base AS prod

COPY --from=build --chown=65532:65532 /venv /venv
# Copy application files
COPY --chown=65532:65532 ./bailo_modelscan_api /app/bailo_modelscan_api
# Run as non-root
USER 65532
