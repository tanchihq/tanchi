# syntax=docker/dockerfile:1

# ---- deps : dépendances de prod uniquement, cache sur le lockfile ----
FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- release : image finale ----
FROM oven/bun:1.3.14-slim AS release
ENV NODE_ENV=production
WORKDIR /app

# curl pour le HEALTHCHECK
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY migrations ./migrations
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# l'utilisateur non-root `bun` est fourni par l'image
USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3000}/" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "src/index.ts"]
