#!/usr/bin/env bash
set -euo pipefail

PGBIN="$(ls -d /usr/lib/postgresql/*/bin | head -1)"

echo "[api] waiting for postgres..."
until "$PGBIN/pg_isready" -h 127.0.0.1 -U postgres -q; do sleep 1; done

if ! "$PGBIN/psql" -h 127.0.0.1 -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='tanchi'" | grep -q 1; then
  echo "[api] creating database tanchi..."
  "$PGBIN/createdb" -h 127.0.0.1 -U postgres tanchi
fi

echo "[api] applying migrations..."
bun scripts/migrate.ts

echo "[api] starting server on :$PORT ..."
exec bun src/index.ts
