# Tanchi

[![CI](https://github.com/tanchihq/tanchi/actions/workflows/ci.yml/badge.svg)](https://github.com/tanchihq/tanchi/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

> Moteur de prospection B2B autonome, open source, self-hostable. L'IA source, renseigne, rédige et relance chaque soir. Vous gardez la main sur l'envoi. Le système apprend de ce qui convertit vraiment, pas de ce qui fait joli.

Tanchi prend le contre-pied des outils de prospection IA :

- **Email-first.** Le seul canal vraiment automatisable proprement. Le reste en assisté (l'IA rédige, l'humain envoie).
- **Renseignement vérifié.** Chaque fait d'un dossier prospect est sourcé sur le site ou le LinkedIn réel. Jamais d'invention, jamais de comblement de trou.
- **Apprentissage qualitatif d'abord.** On distille en langage clair ce qui convertit par ICP, avant toute statistique. Interprétable, corrigeable, efficace dès le premier mois.
- **On mesure les réponses et les RDV, jamais les ouvertures.**

Le cœur du projet — sourcing, pipeline de renseignement, agents, boucle d'apprentissage — est décrit dans **[apps/api/README-moteur.md](./apps/api/README-moteur.md)**.

---

## Démarrage rapide (self-hosted, Docker)

Pré-requis : Docker + Docker Compose, et une clé API Anthropic.

```bash
git clone git@github.com:tanchihq/tanchi.git
cd tanchi
cp .env.example .env
# éditer .env : mettre ANTHROPIC_API_KEY, AUTH_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD
docker compose up -d --build
```

- Front : http://localhost:8080
- API : http://localhost:3000

Les migrations SQL s'appliquent automatiquement au démarrage de l'API (idempotent).

> **Auth en local (http).** Better Auth pose des cookies `Secure` en production, qui ne
> transitent pas sur `http://localhost`. Pour une vraie mise en ligne, servez le front et
> l'API derrière HTTPS sur un domaine parent commun (ex. `app.tanchi.io` / `api.tanchi.io`)
> via un reverse-proxy (Caddy, Traefik, nginx) et renseignez `APP_URL`, `AUTH_BASE_URL`,
> `VITE_API_URL` en conséquence dans `.env`.

---

## Développement (Bun)

Stack : **Bun** partout (runtime, package manager, tests). Pas de npm/pnpm/yarn.

```bash
bun install            # installe tout le workspace
bun run dev            # lance api + web en parallèle
bun run dev:api        # api seule (http://localhost:3000)
bun run dev:web        # web seul (http://localhost:5173)
bun run typecheck      # typecheck api + web
bun test               # tests de l'api
```

L'API a besoin d'un PostgreSQL et d'un Redis. Le plus simple en dev :

```bash
docker compose up -d postgres redis
cd apps/api && cp .env.example .env   # ajuster si besoin
bun run migrate                        # depuis la racine
```

---

## Structure du monorepo

```
tanchi/
  apps/
    api/          # back Hono + Bun + PostgreSQL (SQL brut, sans ORM) + BullMQ
    web/          # front React + Vite
  packages/
    shared/       # vocabulaire et types partagés front/back (@app/shared)
  docker-compose.yml
  .env.example
  LICENSE         # AGPL-3.0
```

Chaque app garde son propre `README.md` et son `CLAUDE.md` (les conventions back et front
diffèrent). Le back suit des règles strictes : SQL brut sans ORM, erreurs comme valeurs,
zéro commentaire, tout immuable — voir [apps/api/CLAUDE.md](./apps/api/CLAUDE.md).

---

## Contribuer

Les contributions sont bienvenues — voir [CONTRIBUTING.md](./CONTRIBUTING.md). En résumé :
Bun uniquement, respect des conventions de chaque app, `bun run typecheck` et `bun test`
au vert avant toute PR.

## Licence

[AGPL-3.0](./LICENSE). Vous pouvez héberger et modifier Tanchi librement ; si vous en
proposez une version modifiée en service réseau, vous devez en publier les sources.

Statut : pré-alpha. Usage interne d'abord, ouverture publique en cours.
