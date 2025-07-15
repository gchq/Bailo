# syntax=docker/dockerfile:1
ARG PYTHON_VERSION=3.12 \
    PYTHONPATH=/venv/lib/python${PYTHON_VERSION}/site-packages \
    PY_IMG=python:${PYTHON_VERSION}-slim-bookworm \
    RUNTIME_IMG=ubuntu:24.04

FROM ${PY_IMG} AS build
ARG PYTHONPATH

COPY requirements.txt /requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m venv /venv && \
    /venv/bin/pip install --upgrade pip setuptools wheel && \
    /venv/bin/pip install -r /requirements.txt

FROM ${RUNTIME_IMG} AS final
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
# Copy venv dependencies
COPY --from=build --chown=65532:65532 /venv /venv
# Copy application files
COPY --chown=65532:65532 ./bailo_modelscan_api /app/bailo_modelscan_api

# Run as non-root
USER 65532
CMD ["python3", "/venv/bin/fastapi", "run", "bailo_modelscan_api/main.py", "--port", "3311"]