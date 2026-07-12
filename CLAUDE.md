# CLAUDE.md — monorepo Tanchi

Ce fichier ne porte que le **commun** au monorepo. Les règles détaillées vivent dans chaque
app et priment quand tu travailles dedans :

- Back : [apps/api/CLAUDE.md](./apps/api/CLAUDE.md) + [apps/api/README-moteur.md](./apps/api/README-moteur.md)
- Front : [apps/web/CLAUDE.md](./apps/web/CLAUDE.md)

## Stack figée

- **Bun partout** : runtime, package manager, tests. Jamais npm/pnpm/yarn.
- Monorepo via Bun workspaces (`apps/*`, `packages/*`).
- Back : Hono + PostgreSQL (SQL brut, sans ORM) + Redis/BullMQ.
- Front : React + Vite.
- Packages internes scopés `@app/*` (jamais publiés sur npm).

## Commandes racine

```
bun install          # tout le workspace
bun run dev          # api + web en parallèle
bun run typecheck    # api + web
bun test             # tests de l'api
bun run migrate      # migrations SQL de l'api
```

## Règles communes

- **Un module/app n'importe jamais le repository d'un autre.** On duplique, on ne couple pas.
- Multi-tenant : aucune requête DB sans filtre d'organisation. Règle de sécurité, pas une préférence.
- Secrets en variables d'env, jamais commités.
- **Renseignement : aucun fait non sourcé dans un dossier.** C'est l'invariant produit n°1.
- Le back interdit les commentaires ; le front a ses propres conventions. Suis le CLAUDE.md de l'app.
