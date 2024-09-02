# syntax=docker/dockerfile:1

FROM node:22.7.0-alpine AS installer

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --cache=/cache/npm

COPY . .
RUN npm run build

FROM node:22.7.0-alpine AS runner

RUN apk update
RUN apk add --no-cache libc6-compat ca-certificates

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --omit=dev --cache=/cache/npm

COPY python-docs python-docs
COPY --from=installer /app/config config
COPY --from=installer /app/dist .

ENV NODE_ENV production
EXPOSE 3001

CMD ["node", "src/index.js"]