# syntax=docker/dockerfile:1
FROM python:3.13.1-bullseye AS sphinx-docs

RUN apt update && apt install -y pandoc

WORKDIR /app/docs

COPY docs .

RUN pip install bailo -r requirements.txt

RUN make dirhtml

FROM node:23.6.0-alpine AS installer

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --cache=/cache/npm

COPY . .
RUN npm run build

FROM node:23.6.0-alpine AS runner

RUN apk update
RUN apk add --no-cache libc6-compat ca-certificates

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --omit=dev --cache=/cache/npm

COPY --from=installer /app/config config
COPY --from=installer /app/dist .
COPY --from=sphinx-docs /app/docs/python-docs python-docs

ENV NODE_ENV production
EXPOSE 3001

CMD ["node", "src/index.js"]
