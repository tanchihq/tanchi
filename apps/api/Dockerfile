# syntax=docker/dockerfile:1
# Build context = repo root (the workspace lockfile lives there).

# ---- deps: production dependencies only, cached on the workspace lockfile ----
FROM oven/bun:1.3.14-slim AS deps
WORKDIR /repo
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
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

COPY --from=deps /repo/node_modules ./node_modules
COPY apps/api/package.json apps/api/tsconfig.json ./
COPY apps/api/src ./src
COPY apps/api/scripts ./scripts
COPY apps/api/migrations ./migrations
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# `claude` CLI for the "cli" provider. Nothing here goes stale: we follow the
# `stable` channel and verify the binary against the checksum Anthropic
# publishes for that release, so the build keeps working without repo updates.
# Pass --build-arg CLAUDE_CODE_VERSION=2.1.231 to pin an exact release instead.
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

# the non-root `bun` user is provided by the image
USER bun
ENV HOME=/home/bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3000}/" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "src/index.ts"]
