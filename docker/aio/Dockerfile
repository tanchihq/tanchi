# syntax=docker/dockerfile:1
# All-in-one image: postgres + redis + api + web in a single container.
# For trial / simple self-host. For serious deployments, use the root docker-compose.yml.

# ---- web build (same-origin: SPA calls /api/* on its own origin) ----
FROM oven/bun:1.3.14 AS web
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN bun install --frozen-lockfile --filter '@app/web'
COPY packages ./packages
COPY apps/web ./apps/web
WORKDIR /repo/apps/web
ENV VITE_API_URL=""
RUN bun run build

# ---- api production deps ----
FROM oven/bun:1.3.14 AS api-deps
WORKDIR /repo
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN bun install --frozen-lockfile --production

# ---- runtime ----
FROM oven/bun:1.3.14
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     postgresql postgresql-client redis-server nginx supervisor openssl curl ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

# `claude` CLI so the wizard's "cli" provider choice works out of the box.
# Auth: docker exec -it tanchi claude — mount a volume on /root/.claude to
# persist the session across container recreations.
# Supply-chain: the installer is pinned by sha256 and never piped straight to
# a shell. Bump CLAUDE_INSTALLER_SHA256 when Anthropic rotates the script.
ARG CLAUDE_CODE_VERSION=stable
ARG CLAUDE_INSTALLER_SHA256=3a68d3406cf674e17bed1733a4dcf37805e2e47d87417700007d7e1aa766a944
RUN curl -fsSL https://claude.ai/install.sh -o /tmp/claude-install.sh \
  && echo "${CLAUDE_INSTALLER_SHA256}  /tmp/claude-install.sh" | sha256sum -c - \
  && bash /tmp/claude-install.sh "${CLAUDE_CODE_VERSION}" \
  && rm -f /tmp/claude-install.sh
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app/api
COPY --from=api-deps /repo/node_modules ./node_modules
COPY apps/api/package.json apps/api/tsconfig.json ./
COPY apps/api/src ./src
COPY apps/api/scripts ./scripts
COPY apps/api/migrations ./migrations
COPY --from=web /repo/apps/web/dist /usr/share/nginx/html

COPY docker/aio/nginx.conf /etc/nginx/sites-available/default
COPY docker/aio/supervisord.conf /etc/supervisor/tanchi.conf
COPY docker/aio/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/aio/api-run.sh /usr/local/bin/api-run.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/api-run.sh

ENV NODE_ENV=production \
    PORT=3000 \
    PGDATA=/var/lib/postgresql/data/pgdata \
    DATABASE_URL=postgres://postgres@127.0.0.1:5432/tanchi \
    REDIS_URL=redis://127.0.0.1:6379 \
    APP_URL=http://localhost:8080 \
    AUTH_BASE_URL=http://localhost:8080 \
    LLM_PROVIDER=api \
    RUN_WORKERS=true \
    TRUSTED_PROXY_COUNT=1 \
    MAIL_FROM_EMAIL="Tanchi <no-reply@tanchi.io>"

VOLUME /var/lib/postgresql/data
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
