# syntax=docker/dockerfile:1
# Build context = repo root (the workspace lockfile lives there).

# ---- Build stage: compile the Vite SPA with Bun ----
FROM oven/bun:1.3.14 AS build
WORKDIR /repo

# Install dependencies first for better layer caching. The workspace
# install needs the root lockfile plus every member's package.json.
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN bun install --frozen-lockfile --filter '@app/web'

# Build the app. VITE_API_URL is inlined at build time by Vite,
# so it must be provided as a build argument (not a runtime env var).
COPY packages ./packages
COPY apps/web ./apps/web
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
WORKDIR /repo/apps/web
RUN bun run build

# ---- Runtime stage: serve the static build with nginx ----
FROM nginx:1.27-alpine AS runner

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
