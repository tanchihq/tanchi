# CLAUDE.md, repo back Tanchi

Instructions pour l'agent de code sur le repo **back**. Le repo front est séparé et a son propre CLAUDE.md.

Ce fichier dit COMMENT on code ici et ce qu'on ne viole jamais. Le QUOI et le POURQUOI sont dans les README. Lis-les avant de coder :

- `README.md` : produit global, canaux, stack, emailing.
- `README-moteur.md` : le coeur. **À lire en entier avant de toucher au sourcing, au renseignement, aux agents ou à la boucle d'apprentissage.**

---

## Stack figée, non négociable

- **Runtime + package manager + test : Bun. Full Bun.**
- Back : Hono (TS).
- Auth : Better Auth (multi-tenant).
- DB : PostgreSQL.
- File / batch : Redis.
- IA : Anthropic API, ou CLI selon config utilisateur.
- Recherche : `web_fetch` prioritaire sur `web_search`.

Choix par défaut du projet (change-les ici et nulle part ailleurs si besoin) :
- Accès DB : **SQL brut via `postgres.js`, aucun ORM.** On écrit le SQL à la main dans les classes `*.postgres.ts`. Pas de Drizzle, pas de Prisma, pas de query builder.
- Migrations : fichiers `.sql` versionnés, appliqués par script. Pas de génération d'ORM.
- Queue du batch du soir : BullMQ sur Redis.

---

## Règles Bun, dures

- **Jamais npm, jamais pnpm, jamais yarn. Aucune exception.**
- Installer : `bun install`. Ajouter : `bun add <pkg>`. Retirer : `bun remove <pkg>`.
- Lancer un script : `bun run <script>`. Exécuter du TS : directement, `bun src/x.ts`, pas de ts-node ni tsx.
- Tests : `bun test` (runner intégré). Pas de vitest ni jest.
- Dev avec reload : `bun --hot src/index.ts`.
- **Lockfile : `bun.lock` uniquement.** Si tu vois apparaître `package-lock.json`, `pnpm-lock.yaml` ou `yarn.lock`, supprime-les. Ne les génère jamais.
- N'ajoute aucune dépendance qui ne tourne pas sous Bun.

---

## Règles de renseignement, NON NÉGOCIABLES

C'est le bug le plus grave possible du produit. Un dossier qui contient un fait faux détruit la confiance et fait cramer un prospect. Respecte ça à la lettre :

- **Jamais** un nom, un logo ou un client dans un dossier s'il n'apparaît pas sur le site ou le LinkedIn du prospect lui-même.
- `web_fetch` du site réel prime **toujours** sur `web_search`. Vérifie sur la source, pas sur un snippet.
- Aucune donnée non sourcée n'entre dans un dossier. Pas de "probablement", pas d'inférence, pas de comblement de trou.
- Chaque fait stocké est attaché à sa source (URL).
- Si un fait n'est pas vérifiable, il n'existe pas. On préfère un dossier plus court que faux.

Si tu génères un dossier, tu dois pouvoir pointer chaque affirmation vers une source récupérée pendant ce run.

---

## Boucle d'apprentissage : ordre de construction imposé

Ne construis pas dans le désordre. La valeur est dans les 3 premiers, pas dans la vectorisation.

1. Tracking propre du reward. On mesure **réponse positive** et **RDV**, jamais les ouvertures.
2. Capture des diffs d'édition humaine (la paire de préférence `IA → édité → résultat`).
3. Playbook distillé par ICP, réécrit par l'Analyste (langage naturel).
4. Retrieval / vectorisation, **sur le profil du prospect, pas sur le texte du message**.
5. Stats structurée par attribut catégoriel.
6. Bandit (Thompson, au niveau de l'angle) en dernier, seulement quand le volume existe.

N'implémente pas 4, 5 ou 6 avant que 1, 2, 3 soient solides et testés.

---

## Modèle de données : figé, ne pas inventer au fil de l'eau

Tables de la boucle (voir README-moteur.md) :

- `messages` : message + attributs catégoriels (angle, longueur, type de CTA, profondeur de perso, canal, ICP, expéditeur, créneau).
- `outcomes` : résultat sur l'échelle de reward + fenêtre d'attribution.
- `edits` : diff de chaque édition humaine.
- `playbook` : document langage naturel par ICP.
- `dossiers` : renseignement sourcé, chaque fait cité.

Tables métier : `companies`, `icps`, `leads`, `sequences`.

Toute évolution du schéma passe par un fichier de migration `.sql` versionné, jamais par une mutation à la volée. Ne crée pas de table ad hoc en dehors de ce modèle sans raison explicite.

---

## Architecture des agents

Pipeline séquentiel le soir, plus un job async. Quatre étapes, pas quatre services lourds.

- Chasseur (sourcing) → Profiler (renseignement + qualif + score + choix canal) → Copywriter (rédaction).
- Analyste : job async hebdo, distille le playbook. Hors du cycle du soir.
- La stratégie (ICP, ton, canaux) est figée au setup, réinjectée. Ce n'est pas un agent qui tourne.

Le batch du soir tourne via la queue Redis (BullMQ).

---

## Conventions de code

### On fonctionne par module

Tout vit sous `src/modules/<module>/`. Un module est autonome : il ne partage avec les autres que ce qui est dans `src/shared/`. **Un module n'importe jamais le repository d'un autre module.** Même si un call user existe déjà ailleurs, on réécrit le repo dans le module courant. On duplique, on ne couple pas.

Anatomie d'un module :

```
src/modules/<module>/
  <module>.controller.ts     # router Hono : routes, validation zod, mapping erreur → HTTP
  <module>.service.ts        # logique métier, orchestration, garde de tenant
  <module>.module.ts         # composition root : postgres → repo → service → router
  <module>.errors.ts         # un enum par cas d'usage (message de validation ET valeur de retour)
  <module>.constants.ts      # MAX_*, TTL, listes de mime `as const`
  <module>.utils.ts          # fonctions pures de conversion Pg* → *Dto
  dto/
    request/<action>.request.ts   # schéma zod + type inféré (même nom), + index.ts barrel
    response/<thing>.response.ts   # type Readonly<{}> (PAS de zod côté réponse), + index.ts barrel
  repository/<entity>/       # un dossier par entité DB, jamais cross-module
    <entity>.entities.ts     # types Pg* (snake_case), Factory, FactoryInput — tous Readonly
    <entity>.postgres.ts     # classe : SQL brut postgres.js, try/catch → throwSanitizeError
    <entity>.repository.ts   # classe : API camelCase, convertit FactoryInput → Factory
    <entity>.utils.ts        # FactoryInput → Factory, id via Bun.randomUUIDv7()
  queue/<job>/               # optionnel : jobs async (BullMQ) — .entities.ts / .service.ts / .processor.ts
```

Flux : `controller (valide zod) → service (règles + tenant) → repository (API camelCase) → postgres (SQL brut) → DB`, puis retour `postgres (Pg*, snake_case) → service (utils.convert* → *Dto) → controller → JSON`.

### DTO

- **Request** : un schéma `z.object({...})` exporté, et son type inféré exporté **sous le même nom** (`export const CreateFolderDto = z.object(...)` puis `export type CreateFolderDto = z.infer<typeof CreateFolderDto>`). Chaque message d'erreur zod pointe vers l'enum d'erreurs du module, jamais une string libre. Les bornes viennent de `constants.ts`.
- **Response** : **pas de zod.** Un `type Readonly<{}>`, `ReadonlyArray<>` pour les listes. Les dates sont des `string` ISO côté DTO, jamais des `Date`.
- Un `index.ts` re-exporte chaque dossier (barrel). Le controller fait `import * as RequestDto`, le service `import type * as ResponseDto`.

### Erreurs comme valeurs, pas comme exceptions

- **Un `enum` par cas d'usage** dans `<module>.errors.ts`, membres string-valués (`invalidName = "invalidName"`). Le même enum sert de message de validation zod **et** de valeur de retour du service.
- Le service retourne une union `Dto | ErrorEnum`, il ne `throw` pas pour un échec métier attendu. Les `throw` restent cantonnés à la couche `postgres` (`throwSanitizeError`) et aux invariants impossibles.
- Le controller `switch` sur le résultat pour mapper chaque erreur vers un code HTTP via `sendError(context, 4xx, result)`.

### Service

- Une classe, dépendances injectées par le constructeur (`private readonly xRepository: XRepository`).
- **Garde de tenant systématique** : on charge l'entité, puis `if (entity === null) return X.inexisting...` et `if (entity.org_id !== orgId) return X.notInMyOrg`. Aucune opération sans ce garde.
- Mapping vers la sortie via `utils.convert*` uniquement, jamais un DTO construit à la main.
- Mise à jour partielle : spread conditionnel (`...(dto.name !== undefined && { name: dto.name })`), qui dépend de `exactOptionalPropertyTypes`.
- Parallélisme via `Promise.all([...])`. Échecs d'infra attrapés, loggés (`console.error("[<module>] ...")`), convertis en enum d'erreur.

### Repository (sans ORM)

Deux classes empilées : `Postgres` (SQL brut) enveloppée par `Repository` (API propre).

- `entities.ts` : `PgX` = shape exact de la table en **`snake_case`** (`org_id`, `created_at`) ; `PgXFactory` = ce qu'on insère ; `XFactoryInput` = l'entrée du service en **`camelCase`**. Tout `Readonly`.
- `postgres.ts` : classe `constructor(private readonly db: DbClient)`. Chaque méthode = un template `this.db<ReadonlyArray<PgX>>\`SELECT ...\`` dans un `try/catch` dont le `catch` fait `return throwSanitizeError(error)`. Colonnes `snake_case`, `RETURNING *`, premier résultat via `result[ARRAY.FIRST_INDEX] ?? null` (jamais `[0]` en dur).
- `repository.ts` : classe `constructor(private readonly xPostgres: XPostgres)`, méthodes `getOne*` / `getMany*` / `createOne*` / `updateOne*` / `deleteOne*`, signatures `camelCase`. Convertit `FactoryInput → Factory` via `utils` avant d'appeler `postgres`.
- **Frontière de casse** : `snake_case` sous `repository/`, `camelCase` partout ailleurs. La conversion se fait dans les `utils`, nulle part ailleurs.

### Typage, dur

- `strict: true`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals` / `noUnusedParameters`.
- **Aucun `any`, aucun `unknown`** non justifié. Un `as never` isolé est toléré uniquement pour le pont `db.json(...)` de postgres.js.
- **Tout est immuable** : `Readonly<{}>` pour les objets, `ReadonlyArray<>` pour les tableaux, `ReadonlyMap<>` pour les maps. Aucun type mutable exposé.
- **Pas de `for`, pas de `forEach`.** On utilise `map` / `filter` / `reduce` / `some` / `Promise.all`. Seule exception : une itération purement impérative où map/filter/reduce n'a pas de sens (performance, I/O, écriture d'en-têtes, migrations séquentielles).
- **Aucun commentaire.** Pas de JSDoc, pas d'inline, pas de TODO, pas de commentaire SQL. Un commentaire est le signe d'un code pas assez explicite : nomme mieux, extrais une fonction nommée.
- IDs via `Bun.randomUUIDv7()`. Imports de fichiers `.ts` explicites, alias `@shared/*` pour le partagé.

### Nommage

- Types DB préfixés `Pg` (`PgCaseFolder`, `PgCaseFolderFactory`).
- Conversions `convert<Source>To<Cible>Dto`. Enums d'erreur `<Action>Errors`. DTO nommé comme son schéma zod.

### Général

- Multi-tenant : chaque requête DB est scopée à l'organisation. Aucune query sans filtre de tenant. C'est une règle de sécurité, pas une préférence.
- Secrets et clés (API Anthropic, mail) : variables d'env, jamais en dur, jamais commités.
- Validation des entrées avec zod sur toutes les routes Hono.

---

## Ce qu'on ne fait jamais

- Automatiser LinkedIn, WhatsApp, Instagram ou l'appel vocal. Mode auto = email uniquement. Les autres canaux produisent un draft, l'humain envoie.
- Apprendre ou optimiser sur les ouvertures.
- Vectoriser le texte des messages plutôt que le profil des prospects.
- Écrire un fait non sourcé dans un dossier.
- Utiliser un autre gestionnaire de paquets que Bun.
- Utiliser un ORM ou un query builder (Drizzle, Prisma, Kysely…). Le SQL est écrit à la main dans les `*.postgres.ts`.
- Importer le repository d'un autre module. On duplique le repo dans le module courant.
- Exposer un type mutable, un `any` ou un `unknown` non justifié.
- Écrire une boucle `for`/`forEach` là où `map`/`filter`/`reduce` suffit.
- Écrire un commentaire. Le code doit se suffire par le nommage et la structure.

---

## Commandes

```
bun install          # dépendances
bun run dev          # dev (--hot)
bun test             # tests
bun run db:migrate   # applique les migrations SQL versionnées
```

Ajuste les noms de scripts au package.json réel, mais garde `bun run` devant tout.
