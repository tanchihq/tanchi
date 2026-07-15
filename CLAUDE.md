# CLAUDE.md — Tanchi monorepo

This file only carries what is **common** to the monorepo. The detailed rules live in each
app and take precedence when you work inside it:

- Backend: [apps/api/CLAUDE.md](./apps/api/CLAUDE.md) + [apps/api/README-moteur.md](./apps/api/README-moteur.md)
- Frontend: [apps/web/CLAUDE.md](./apps/web/CLAUDE.md)

## Fixed stack

- **Bun everywhere**: runtime, package manager, tests. Never npm/pnpm/yarn.
- Monorepo via Bun workspaces (`apps/*`, `packages/*`).
- Backend: Hono + PostgreSQL (raw SQL, no ORM) + Redis/BullMQ.
- Frontend: React + Vite.
- Internal packages scoped `@app/*` (never published to npm).

## Root commands

```
bun install          # whole workspace
bun run dev          # api + web in parallel
bun run typecheck    # api + web
bun run test         # api tests
bun run migrate      # API SQL migrations
```

## Common rules

- **A module/app never imports another module's repository.** Duplicate, don't couple.
- Multi-tenant: no DB query without an organization filter. It's a security rule, not a preference.
- Secrets in env vars, never committed.
- **Intelligence: no unsourced fact ever enters a dossier.** This is product invariant #1.
- The backend forbids comments; the frontend has its own conventions. Follow the app's CLAUDE.md.
