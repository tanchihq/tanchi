# Déploiement — Dokploy (repo git lié + Dockerfile)

L'API tourne dans une image Bun construite depuis le `Dockerfile`. Dokploy
clone le repo, build l'image, et lance le conteneur. Postgres et Redis sont
des services séparés provisionnés dans Dokploy.

## 1. Provisionner Postgres et Redis

Dans le projet Dokploy, crée deux databases :

- **PostgreSQL 16** → note le nom interne du service (host) et les identifiants.
- **Redis 7**.

Les apps et databases d'un même projet Dokploy partagent le réseau interne :
on les joint par leur nom de service (ex. `sweeleads-postgres`), pas `localhost`.

## 2. Créer l'application

- **Type** : Application.
- **Source** : ce repo git (branche de déploiement).
- **Build Type** : `Dockerfile` (chemin `./Dockerfile`).
- **Port** : `3000` (ce que le conteneur expose).
- **Domaine** : attache `api.sweeleads.com` → Dokploy route Traefik vers le port 3000 et gère le TLS.

## 3. Variables d'environnement

Onglet **Environment** de l'app. Voir `.env.production.example`. Minimum requis :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | connexion vers le Postgres Dokploy (host interne) |
| `REDIS_URL` | connexion vers le Redis Dokploy |
| `APP_URL` | origine du front (CORS) |
| `AUTH_BASE_URL` | URL publique de cette API |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `LLM_PROVIDER` | `api` (le CLI `claude` n'existe pas en conteneur) |
| `ANTHROPIC_API_KEY` | clé Anthropic |
| `RUN_WORKERS` | `true` pour le batch du soir + reward + sequences |

## 4. Migrations

Au démarrage, `docker-entrypoint.sh` applique les migrations SQL
(`bun scripts/migrate.ts`) avant de lancer le serveur. C'est idempotent
(table `_migrations`). Pour désactiver : `RUN_MIGRATIONS=false`.

> Une seule instance doit appliquer les migrations. Si tu passes à plusieurs
> replicas, mets `RUN_MIGRATIONS=false` sur les replicas et applique les
> migrations depuis une instance dédiée.

## 5. Vérifier

- Healthcheck conteneur : `GET /` renvoie `{ "name": "sweeleads-api", ... }`.
- Logs Dokploy : `[entrypoint] applying migrations...` puis `🚀 sweeleads-api running`.
- Si `RUN_WORKERS=true` : `[workers] engine-nightly + reward-poll + sequences démarrés`.

## Build local (optionnel)

```
docker build -t sweeleads-api .
docker run --rm -p 3000:3000 --env-file .env.production sweeleads-api
```
