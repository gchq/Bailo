# syntax=docker/dockerfile:1

FROM node:24.4.0-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat ca-certificates
RUN apk update

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm install --omit=dev --cache=/cache/npm

EXPOSE 3000

FROM base AS dev

# Pickup dev packages too
RUN --mount=type=cache,target=/cache/npm npm install --cache=/cache/npm

COPY . .

RUN npm install sharp@0.33.5

CMD [ "npm", "run", "dev" ]

FROM dev AS build

WORKDIR /app
RUN npm run build

FROM base AS prod
ENV PORT=3000
COPY --from=dev /app/next.config.mjs .
COPY --from=dev /app/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=nextjs:0 /app/.next/standalone ./
COPY --from=build --chown=nextjs:0 /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:0 /app/public ./public

RUN chmod -R g=u /app

USER nextjs

CMD ["node", "server.js"]
