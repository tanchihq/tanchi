#!/bin/sh
set -e

# Applies the versioned SQL migrations before starting the server.
# Idempotent (_migrations table). Can be disabled with RUN_MIGRATIONS=false.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] applying migrations..."
  bun scripts/migrate.ts
fi

echo "[entrypoint] starting: $*"
exec "$@"
