#!/bin/sh
set -e

# Applique les migrations SQL versionnées avant de démarrer le serveur.
# Idempotent (table _migrations). Désactivable avec RUN_MIGRATIONS=false.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] applying migrations..."
  bun scripts/migrate.ts
fi

echo "[entrypoint] starting: $*"
exec "$@"
