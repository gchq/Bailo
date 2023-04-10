FROM node:19-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

COPY . .
RUN npm install

ENV NEXT_TELEMETRY_DISABLED 1
RUN npx turbo run build --filter=@bailo/frontend...

FROM node:19-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/frontend/next.config.mjs .
COPY --from=builder /app/frontend/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=1001:1001 /app/frontend/.next/standalone/app ./
COPY --from=builder --chown=1001:1001 /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=1001:1001 /app/frontend/public ./frontend/public

USER 1001

ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000
ENV PORT 3000

CMD ["node", "frontend/server.js"]
