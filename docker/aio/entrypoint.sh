#!/usr/bin/env bash
set -euo pipefail

PGBIN="$(ls -d /usr/lib/postgresql/*/bin | head -1)"
export PGBIN

DATA_ROOT="${DATA_ROOT:-/var/lib/postgresql/data}"
export PGDATA="$DATA_ROOT/pgdata"
CONFIG_FILE="$DATA_ROOT/.tanchi.env"
SECRETS_FILE="$DATA_ROOT/.tanchi-secrets.env"

mkdir -p "$DATA_ROOT"

if [ "${1:-}" = "setup" ]; then
  exec bun /app/api/scripts/setup.ts --aio --out "$CONFIG_FILE"
fi

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[entrypoint] initializing postgres cluster..."
  su postgres -c "$PGBIN/initdb -D '$PGDATA' --auth-local=trust --auth-host=trust --username=postgres" >/dev/null
  echo "listen_addresses='127.0.0.1'" >> "$PGDATA/postgresql.conf"
fi

if [ ! -f "$SECRETS_FILE" ]; then
  echo "[entrypoint] generating persistent secrets on the data volume..."
  {
    echo "AUTH_SECRET=$(openssl rand -hex 32)"
    echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
  } > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
fi
export AUTH_SECRET="${AUTH_SECRET:-$(sed -n 's/^AUTH_SECRET=//p' "$SECRETS_FILE")}"
export ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(sed -n 's/^ENCRYPTION_KEY=//p' "$SECRETS_FILE")}"

if [ ! -f "$CONFIG_FILE" ] && [ -t 0 ]; then
  echo "[entrypoint] first run with a terminal — launching the setup wizard..."
  bun /app/api/scripts/setup.ts --aio --out "$CONFIG_FILE" || true
fi
if [ -f "$CONFIG_FILE" ]; then
  while IFS= read -r line; do
    case "$line" in ''|\#*) continue ;; esac
    key="${line%%=*}"
    value="${line#*=}"
    if [ -z "$(printenv "$key" 2>/dev/null || true)" ]; then
      export "$key=$value"
    fi
  done < "$CONFIG_FILE"
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "[entrypoint] WARNING: ANTHROPIC_API_KEY is not set — the engine and chat will not work."
fi

echo "[entrypoint] starting services (postgres, redis, api, nginx) on :8080 ..."
exec supervisord -c /etc/supervisor/tanchi.conf
