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

# the non-root `bun` user is provided by the image
USER bun
ENV HOME=/home/bun
# Supply-chain: the installer is pinned by sha256 and never piped straight to
# a shell. Bump CLAUDE_INSTALLER_SHA256 when Anthropic rotates the script.
ARG CLAUDE_CODE_VERSION=stable
ARG CLAUDE_INSTALLER_SHA256=3a68d3406cf674e17bed1733a4dcf37805e2e47d87417700007d7e1aa766a944
RUN curl -fsSL https://claude.ai/install.sh -o /tmp/claude-install.sh \
  && echo "${CLAUDE_INSTALLER_SHA256}  /tmp/claude-install.sh" | sha256sum -c - \
  && bash /tmp/claude-install.sh "${CLAUDE_CODE_VERSION}" \
  && rm -f /tmp/claude-install.sh
ENV PATH="/home/bun/.local/bin:${PATH}"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3000}/" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "src/index.ts"]
