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

FROM node:24.0.2-alpine AS installer

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --cache=/cache/npm

COPY . .
RUN npm run build

FROM node:24.0.2-alpine AS runner

RUN apk update
RUN apk add --no-cache libc6-compat ca-certificates

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --omit=dev --cache=/cache/npm

COPY --from=installer /app/config config
COPY --from=installer /app/dist .
COPY --from=sphinx-docs /app/docs/python-docs python-docs

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
