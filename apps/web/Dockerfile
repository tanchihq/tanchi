# syntax=docker/dockerfile:1

# ---- Build stage: compile the Vite SPA with Bun ----
FROM oven/bun:1 AS build
WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the app. VITE_API_URL is inlined at build time by Vite,
# so it must be provided as a build argument (not a runtime env var).
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build

# ---- Runtime stage: serve the static build with nginx ----
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
