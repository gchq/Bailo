FROM node:16-alpine as installer

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:16-alpine AS runner

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/next.config.mjs .
COPY --from=installer /app/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=1001:1001 /app/.next/standalone ./
COPY --from=installer --chown=1001:1001 /app/.next/static ./.next/static
COPY --from=installer --chown=1001:1001 /app/public ./public

USER 1001

ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
