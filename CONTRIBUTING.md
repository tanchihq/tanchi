# Contributing to Tanchi

Thanks for wanting to contribute. This project is a Bun monorepo.

## Prerequisites

- [Bun](https://bun.sh) (the `bun.lock` is the source of truth — **never** npm, pnpm or yarn).
- Docker + Docker Compose for PostgreSQL and Redis in local dev.

## Getting started

```bash
bun install
cp .env.example .env          # single .env at the repo root
docker compose up -d postgres redis
bun run migrate
bun run dev
```

## Before opening a PR

- `bun run typecheck` green (api + web).
- `bun run test` green.
- Follow the conventions of the app you touch:
  - **Backend** (`apps/api`): raw SQL without an ORM, errors as values, everything
    immutable, **zero comments**, one module per domain. Details in
    [apps/api/CLAUDE.md](./apps/api/CLAUDE.md).
  - **Frontend** (`apps/web`): conventions in [apps/web/CLAUDE.md](./apps/web/CLAUDE.md).

## Non-negotiable rule: intelligence

No unsourced data ever enters a prospect dossier. A fact that does not appear on the
prospect's own website or LinkedIn does not exist. Any contribution to the intelligence
engine must preserve this guarantee — see
[apps/api/README-moteur.md](./apps/api/README-moteur.md).

## Commits & branches

- One branch per topic, PR against `main`.
- Clear, imperative commit messages.
