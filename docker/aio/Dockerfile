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
# Nothing here goes stale: we follow the `stable` channel and verify the binary
# against the checksum Anthropic publishes for that release, so the build keeps
# working without repo updates. Pass --build-arg CLAUDE_CODE_VERSION=2.1.231
# to pin an exact release instead.
ARG CLAUDE_CODE_VERSION=stable
ARG TARGETARCH
RUN set -eu; \
  base="https://downloads.claude.ai/claude-code-releases"; \
  case "${TARGETARCH:-$(dpkg --print-architecture)}" in \
    amd64) platform="linux-x64" ;; \
    arm64) platform="linux-arm64" ;; \
    *) echo "unsupported architecture: ${TARGETARCH:-unknown}" >&2; exit 1 ;; \
  esac; \
  version="${CLAUDE_CODE_VERSION}"; \
  case "$version" in \
    stable|latest) version="$(curl -fsSL "${base}/${CLAUDE_CODE_VERSION}")" ;; \
  esac; \
  case "$version" in \
    [0-9]*.[0-9]*.[0-9]*) ;; \
    *) echo "unexpected version from ${base}/${CLAUDE_CODE_VERSION}: ${version}" >&2; exit 1 ;; \
  esac; \
  checksum="$(curl -fsSL "${base}/${version}/manifest.json" \
    | PLATFORM="$platform" bun -e 'const manifest = await Bun.stdin.json(); const target = manifest.platforms[Bun.env.PLATFORM]; if (!target?.checksum) { throw new Error(`no checksum published for ${Bun.env.PLATFORM}`); } console.write(target.checksum);')"; \
  curl -fsSL "${base}/${version}/${platform}/claude" -o /usr/local/bin/claude; \
  echo "${checksum}  /usr/local/bin/claude" | sha256sum -c -; \
  chmod 755 /usr/local/bin/claude

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
