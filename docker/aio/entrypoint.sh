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

touch "$SECRETS_FILE"
chmod 600 "$SECRETS_FILE"
ensure_secret() {
  if ! grep -q "^$1=" "$SECRETS_FILE" 2>/dev/null; then
    echo "$1=$2" >> "$SECRETS_FILE"
  fi
}
echo "[entrypoint] ensuring persistent secrets on the data volume..."
ensure_secret AUTH_SECRET "$(openssl rand -hex 32)"
ensure_secret ENCRYPTION_KEY "$(openssl rand -base64 32)"
ensure_secret POSTGRES_PASSWORD "$(openssl rand -hex 32)"
ensure_secret REDIS_PASSWORD "$(openssl rand -hex 32)"
export AUTH_SECRET="${AUTH_SECRET:-$(sed -n 's/^AUTH_SECRET=//p' "$SECRETS_FILE")}"
export ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(sed -n 's/^ENCRYPTION_KEY=//p' "$SECRETS_FILE")}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(sed -n 's/^POSTGRES_PASSWORD=//p' "$SECRETS_FILE")}"
export REDIS_PASSWORD="${REDIS_PASSWORD:-$(sed -n 's/^REDIS_PASSWORD=//p' "$SECRETS_FILE")}"

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[entrypoint] initializing postgres cluster..."
  PWFILE="$(mktemp)"
  printf '%s\n' "$POSTGRES_PASSWORD" > "$PWFILE"
  chown postgres "$PWFILE"
  chmod 600 "$PWFILE"
  su postgres -c "$PGBIN/initdb -D '$PGDATA' --auth-local=trust --auth-host=scram-sha-256 --username=postgres --pwfile='$PWFILE'" >/dev/null
  rm -f "$PWFILE"
  echo "listen_addresses='127.0.0.1'" >> "$PGDATA/postgresql.conf"
fi

export DATABASE_URL="postgres://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/tanchi"
export REDIS_URL="redis://:${REDIS_PASSWORD}@127.0.0.1:6379"

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

case "${LLM_PROVIDER:-api}" in
  api|anthropic) required_llm_key="ANTHROPIC_API_KEY" ;;
  openai)        required_llm_key="OPENAI_API_KEY" ;;
  gemini)        required_llm_key="GEMINI_API_KEY" ;;
  kimi)          required_llm_key="MOONSHOT_API_KEY" ;;
  *)             required_llm_key="" ;;
esac

if [ -n "$required_llm_key" ] && [ -z "$(printenv "$required_llm_key" 2>/dev/null || true)" ]; then
  echo "[entrypoint] WARNING: LLM_PROVIDER=${LLM_PROVIDER:-api} but $required_llm_key is not set — the engine and chat will not work."
fi

if [ -n "${LLM_RESEARCH_PROVIDER:-}" ]; then
  case "$LLM_RESEARCH_PROVIDER" in
    api|anthropic) research_key="ANTHROPIC_API_KEY" ;;
    openai)        research_key="OPENAI_API_KEY" ;;
    gemini)        research_key="GEMINI_API_KEY" ;;
    kimi)          research_key="MOONSHOT_API_KEY" ;;
    *)             research_key="" ;;
  esac
  if [ -n "$research_key" ] && [ -z "$(printenv "$research_key" 2>/dev/null || true)" ]; then
    echo "[entrypoint] WARNING: LLM_RESEARCH_PROVIDER=$LLM_RESEARCH_PROVIDER but $research_key is not set — prospect research will fail."
  fi
fi

echo "[entrypoint] starting services (postgres, redis, api, nginx) on :8080 ..."
exec supervisord -c /etc/supervisor/tanchi.conf
