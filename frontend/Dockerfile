# syntax=docker/dockerfile:1

FROM node:24.0.2-alpine AS installer

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/cache/npm npm ci --cache=/cache/npm

COPY . .

RUN npm install sharp@0.33.5

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24.0.2-alpine AS runner

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=installer /app/next.config.mjs .
COPY --from=installer /app/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:0 /app/.next/standalone ./
COPY --from=installer --chown=nextjs:0 /app/.next/static ./.next/static
COPY --from=installer --chown=nextjs:0 /app/public ./public

RUN chmod -R g=u /app

USER nextjs

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
