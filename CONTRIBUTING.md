# Contribuer à Tanchi

Merci de vouloir contribuer. Ce projet est un monorepo Bun.

## Pré-requis

- [Bun](https://bun.sh) (le `bun.lock` fait foi — **jamais** npm, pnpm ni yarn).
- Docker + Docker Compose pour PostgreSQL et Redis en local.

## Mise en route

```bash
bun install
docker compose up -d postgres redis
bun run migrate
bun run dev
```

## Avant d'ouvrir une PR

- `bun run typecheck` au vert (api + web).
- `bun test` au vert.
- Respecter les conventions de l'app touchée :
  - **Back** (`apps/api`) : SQL brut sans ORM, erreurs comme valeurs, tout immuable,
    **zéro commentaire**, un module par domaine. Détails dans
    [apps/api/CLAUDE.md](./apps/api/CLAUDE.md).
  - **Front** (`apps/web`) : conventions dans [apps/web/CLAUDE.md](./apps/web/CLAUDE.md).

## Règle non négociable : le renseignement

Aucune donnée non sourcée n'entre dans un dossier prospect. Un fait qui n'apparaît pas sur
le site ou le LinkedIn réel du prospect n'existe pas. Toute contribution au moteur de
renseignement doit préserver cette garantie — voir
[apps/api/README-moteur.md](./apps/api/README-moteur.md).

## Commits & branches

- Une branche par sujet, PR vers `main`.
- Messages de commit clairs et impératifs.
