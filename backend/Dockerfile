# syntax=docker/dockerfile:1

FROM python:3.14.2-alpine3.23@sha256:31da4cb527055e4e3d7e9e006dffe9329f84ebea79eaca0a1f1c27ce61e40ca5 AS sphinx-docs

# Prevents Python from writing pyc files, and from buffering stdout and stderr to avoid situations where the application crashes without emitting any logs due to buffering.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apk add --no-cache pandoc make

WORKDIR /app/docs

COPY docs/requirements.txt .
COPY --from=python pyproject.toml /app/python/
COPY --from=python README.md /app/python/
COPY --from=python src /app/python/src

RUN --mount=type=cache,target=/root/.cache/pip pip install -e /app/python -r requirements.txt

COPY docs .

RUN make html

FROM node:26.7.0-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS node-base

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
