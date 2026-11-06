# syntax=docker/dockerfile:1

FROM node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94 AS base
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat ca-certificates

WORKDIR /app

COPY package*.json ./

EXPOSE 3000

FROM base AS dev

RUN --mount=type=cache,target=/cache/npm npm ci --cache=/cache/npm

COPY . .

CMD [ "npm", "run", "dev" ]

FROM dev AS build

WORKDIR /app
RUN npm run build

FROM base AS prod
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:0 /app/next.config.mjs .
COPY --from=build --chown=nextjs:0 /app/package.json .
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=nextjs:0 /app/.next/standalone ./
COPY --from=build --chown=nextjs:0 /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:0 /app/public ./public

USER nextjs

CMD ["node", "server.js"]
