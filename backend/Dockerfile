# syntax=docker/dockerfile:1

FROM ghcr.io/astral-sh/uv:python3.14-alpine@sha256:65b922d2241d4c54318c4140d5e380d10e75c608dae409a750c587aa466da077 AS sphinx-docs

# Prevents Python from writing pyc files, and from buffering stdout and stderr to avoid situations where the application crashes without emitting any logs due to buffering.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/venv \
    UV_COMPILE_BYTECODE=0 \
    UV_LINK_MODE=copy \
    PATH="/venv/bin:$PATH"

RUN apk add --no-cache pandoc make

WORKDIR /app/docs

COPY --from=python pyproject.toml /app/python/
COPY --from=python README.md /app/python/
COPY --from=python src /app/python/src

# `--no-install-project` skips bailo-docs itself which has no modules
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=docs/uv.lock,target=uv.lock \
    --mount=type=bind,source=docs/pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev --no-install-project && \
    uv pip install -e /app/python

COPY docs .

RUN make html

FROM node:26.8.1-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS node-base

RUN apk add --no-cache libc6-compat ca-certificates

WORKDIR /app

FROM node-base AS node-build

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm ci --omit=dev --cache=/cache/npm

FROM node-base AS base

COPY --from=sphinx-docs /app/docs/python-docs python-docs
COPY --from=node-build /app/node_modules node_modules

EXPOSE 3001

FROM base AS dev

# Pickup dev packages too
COPY --from=node-build /app/package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --cache=/cache/npm

COPY . .

EXPOSE 9229

CMD [ "npm", "run", "dev" ]

FROM dev AS build

WORKDIR /app
RUN npm run build

FROM base AS prod
ENV NODE_ENV=production

# Don't run production as root (match frontend UID)
RUN addgroup --system --gid 1001 backend && \
    adduser --system --uid 1001 --ingroup backend backend

COPY --from=build --chown=backend:backend /app/config config
COPY --from=build --chown=backend:backend /app/dist .

USER backend

CMD ["node", "src/index.js"]
