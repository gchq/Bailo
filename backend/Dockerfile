# syntax=docker/dockerfile:1
FROM python:3.13.2-bookworm AS sphinx-docs

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout and stderr to avoid situations where the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y pandoc && rm -rf /var/lib/apt/lists/*

WORKDIR /app/docs

COPY docs .

RUN --mount=type=cache,target=/root/.cache/pip pip install --upgrade bailo -r requirements.txt

RUN make dirhtml

FROM node:24.4.0-alpine AS base

RUN apk add --no-cache libc6-compat ca-certificates
RUN apk update

WORKDIR /app

COPY --from=sphinx-docs /app/docs/python-docs python-docs
COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --omit=dev --cache=/cache/npm

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
