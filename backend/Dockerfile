# syntax=docker/dockerfile:1

FROM python:3.13.2-bookworm AS sphinx-docs

# Prevents Python from writing pyc files, and from buffering stdout and stderr to avoid situations where the application crashes without emitting any logs due to buffering.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Cache packages with run cache, update system packages, install pandoc
RUN --mount=type=cache,target=/var/cache/apt --mount=type=cache,target=/var/lib/apt \
    rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    apt-get update && \
    apt-get install -y --no-install-recommends pandoc

WORKDIR /app/docs

COPY docs .
# Only get the required dirs & files (ignore tests etc.)
COPY --from=python pyproject.toml /app/python/
COPY --from=python README.md /app/python/
COPY --from=python src /app/python/src

RUN --mount=type=cache,target=/root/.cache/pip pip install -e /app/python -r requirements.txt

RUN make dirhtml

FROM node:24.9.0-alpine AS base

RUN apk add --no-cache libc6-compat ca-certificates && \
    apk update

WORKDIR /app

COPY --from=sphinx-docs /app/docs/python-docs python-docs

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm ci --omit=dev --cache=/cache/npm

EXPOSE 3001

FROM base AS dev

# Pickup dev packages too
RUN --mount=type=cache,target=/cache/npm npm install --cache=/cache/npm

COPY . .

EXPOSE 9229

CMD [ "npm", "run", "dev" ]

FROM dev AS build

WORKDIR /app
RUN npm run build

FROM base AS prod
ENV NODE_ENV=production

COPY --from=build /app/config config
COPY --from=build /app/dist .

CMD ["node", "src/index.js"]
