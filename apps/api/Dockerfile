# syntax=docker/dockerfile:1

# ---- deps: production dependencies only, cached on the lockfile ----
FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- release: final image (prod + dev) ----
# The `claude` CLI is embedded for everyone. The LLM provider stays driven
# by the LLM_PROVIDER variable (api in prod, cli in dev).
# Cli auth: open the container terminal, type `claude`, copy the link into
# your browser, paste the code back. Mount a volume on /home/bun/.claude so
# that the session survives redeploys.
FROM oven/bun:1.3.14-slim AS release
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY migrations ./migrations
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# the non-root `bun` user is provided by the image
USER bun
ENV HOME=/home/bun
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/home/bun/.local/bin:${PATH}"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3000}/" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "src/index.ts"]
