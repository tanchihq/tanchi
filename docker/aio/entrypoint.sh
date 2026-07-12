#!/usr/bin/env bash
set -euo pipefail

PGBIN="$(ls -d /usr/lib/postgresql/*/bin | head -1)"
export PGBIN
export PGDATA="${PGDATA:-/var/lib/postgresql/data}"

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[entrypoint] initializing postgres cluster..."
  su postgres -c "$PGBIN/initdb -D '$PGDATA' --auth-local=trust --auth-host=trust --username=postgres" >/dev/null
  echo "listen_addresses='127.0.0.1'" >> "$PGDATA/postgresql.conf"
fi

SECRETS_FILE="$PGDATA/.tanchi-secrets.env"
if [ ! -f "$SECRETS_FILE" ]; then
  echo "[entrypoint] generating persistent secrets on the data volume..."
  {
    echo "AUTH_SECRET=$(openssl rand -hex 32)"
    echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
  } > "$SECRETS_FILE"
  chown postgres:postgres "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
fi
export AUTH_SECRET="${AUTH_SECRET:-$(sed -n 's/^AUTH_SECRET=//p' "$SECRETS_FILE")}"
export ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(sed -n 's/^ENCRYPTION_KEY=//p' "$SECRETS_FILE")}"

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "[entrypoint] WARNING: ANTHROPIC_API_KEY is not set — the engine and chat will not work."
fi

echo "[entrypoint] starting services (postgres, redis, api, nginx) on :8080 ..."
exec supervisord -c /etc/supervisor/tanchi.conf
