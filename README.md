# Tanchi

[![CI](https://github.com/tanchihq/tanchi/actions/workflows/ci.yml/badge.svg)](https://github.com/tanchihq/tanchi/actions/workflows/ci.yml)
[![Docker image](https://github.com/tanchihq/tanchi/actions/workflows/docker.yml/badge.svg)](https://github.com/tanchihq/tanchi/actions/workflows/docker.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

> Autonomous B2B prospecting engine — open source, self-hostable. The AI sources, researches, writes and follows up every night. You stay in control of what gets sent. The system learns from what actually converts, not from what looks nice.

Tanchi takes the opposite stance to most AI prospecting tools:

- **Email-first.** The only channel that is genuinely safe to automate. Everything else is assisted (the AI drafts, a human sends).
- **Verified intelligence.** Every fact in a prospect dossier is sourced from the prospect's own website or LinkedIn. Never invented, never a filled-in gap.
- **Qualitative learning first.** We distill, in plain language, what converts per ICP before any statistics. Interpretable, correctable, effective from month one.
- **We measure replies and meetings, never opens.**

The heart of the project — sourcing, the intelligence pipeline, the agents, the learning loop — is described in **[apps/api/README-moteur.md](./apps/api/README-moteur.md)**.

---

## Quickstart

### Fastest — one container (trial / simple self-host)

Everything (PostgreSQL, Redis, API, web) in a single image. You only need Docker and an Anthropic API key.

```bash
docker run -d --name tanchi \
  -p 8080:8080 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -v tanchi-data:/var/lib/postgresql/data \
  tanchihq/tanchi
```

Open http://localhost:8080. Database migrations run automatically; session secrets are generated and persisted to the data volume on first boot. Because the web app and API are served same-origin behind one port, cookie auth works out of the box over `http://localhost`.

### Full — docker compose (services split, recommended for real deployments)

```bash
git clone git@github.com:tanchihq/tanchi.git
cd tanchi
cp .env.example .env
# edit .env: ANTHROPIC_API_KEY, AUTH_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD
docker compose up -d --build
```

- Web: http://localhost:8080
- API: http://localhost:3000

> **Auth behind a domain.** For a real deployment, serve the web app and API over HTTPS on a shared parent domain (e.g. `app.tanchi.io` / `api.tanchi.io`) via a reverse proxy (Caddy, Traefik, nginx) and set `APP_URL`, `AUTH_BASE_URL`, `VITE_API_URL` accordingly in `.env`.

---

## Development (Bun)

Stack: **Bun** everywhere (runtime, package manager, tests). No npm/pnpm/yarn.

```bash
bun install            # install the whole workspace
cp .env.example .env   # single .env at the repo root, read by both apps
bun run dev            # api + web in parallel
bun run dev:api        # api only  (http://localhost:3000)
bun run dev:web        # web only  (http://localhost:5173)
bun run typecheck      # typecheck api + web
bun test               # api tests
```

The API needs PostgreSQL and Redis. Simplest in dev:

```bash
docker compose up -d postgres redis
bun run migrate
```

> **One `.env` at the repo root.** Both apps read the root `.env` (the API via `--env-file`, the web via Vite `envDir`). Required keys: `DATABASE_URL`, `AUTH_SECRET` (≥32 chars), `ENCRYPTION_KEY` (≥44 chars, `openssl rand -base64 32`).

---

## Monorepo layout

```
tanchi/
  apps/
    api/          # Hono + Bun + PostgreSQL backend (raw SQL, no ORM) + BullMQ
    web/          # React + Vite frontend
  packages/
    shared/       # vocabulary and types shared front/back (@app/shared)
  docker/aio/     # all-in-one image (postgres + redis + api + web)
  docker-compose.yml
  .env.example
  LICENSE         # AGPL-3.0
```

Each app keeps its own `README.md` and `CLAUDE.md` (the backend and frontend conventions differ). The backend follows strict rules: raw SQL without an ORM, errors as values, zero comments, everything immutable — see [apps/api/CLAUDE.md](./apps/api/CLAUDE.md).

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). In short: Bun only, follow each app's conventions, `bun run typecheck` and `bun test` green before any PR.

## License

[AGPL-3.0](./LICENSE). You may host and modify Tanchi freely; if you offer a modified version as a network service, you must publish its source.

Status: pre-alpha. Internal use first, public opening in progress.
