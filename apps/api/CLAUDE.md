# CLAUDE.md, back repo Tanchi

Instructions for the code agent on the **back** repo. The front repo is separate and has its own CLAUDE.md.

This file says HOW we code here and what we never violate. The WHAT and the WHY are in the READMEs. Read them before coding:

- `README.md`: overall product, channels, stack, emailing.
- `README-moteur.md`: the core. **Read it in full before touching sourcing, intelligence, agents or the learning loop.**

---

## Frozen stack, non-negotiable

- **Runtime + package manager + test: Bun. Full Bun.**
- Back: Hono (TS).
- Auth: Better Auth (multi-tenant).
- DB: PostgreSQL.
- File / batch: Redis.
- AI: Claude by default (Anthropic API, or CLI depending on user config). Self-hosted may set `LLM_PROVIDER` to `openai`, `gemini` or `kimi`; providers live in `src/shared/llm/`.
- Search: `web_fetch` takes priority over `web_search`. A provider without usable web search cannot run the engine — the boot guard refuses rather than produce unsourced dossiers.

Project default choices (change them here and nowhere else if needed):
- DB access: **raw SQL via `postgres.js`, no ORM.** We write the SQL by hand in the `*.postgres.ts` classes. No Drizzle, no Prisma, no query builder.
- Migrations: versioned `.sql` files, applied by script. No ORM generation.
- Evening batch queue: BullMQ on Redis.

---

## Bun rules, hard

- **Never npm, never pnpm, never yarn. No exception.**
- Install: `bun install`. Add: `bun add <pkg>`. Remove: `bun remove <pkg>`.
- Run a script: `bun run <script>`. Execute TS: directly, `bun src/x.ts`, no ts-node or tsx.
- Tests: `bun test` (built-in runner). No vitest or jest.
- Dev with reload: `bun --hot src/index.ts`.
- **Lockfile: `bun.lock` only.** If you see `package-lock.json`, `pnpm-lock.yaml` or `yarn.lock` appear, delete them. Never generate them.
- Do not add any dependency that does not run under Bun.

---

## Intelligence rules, NON-NEGOTIABLE

This is the most serious bug the product can have. A dossier that contains a false fact destroys trust and burns a prospect. Follow this to the letter:

- **Never** a name, a logo or a client in a dossier if it does not appear on the prospect's own site or LinkedIn.
- `web_fetch` of the real site **always** takes priority over `web_search`. Verify on the source, not on a snippet.
- No unsourced data enters a dossier. No "probably", no inference, no gap-filling.
- Every stored fact is attached to its source (URL).
- If a fact is not verifiable, it does not exist. We prefer a shorter dossier over a false one.

If you generate a dossier, you must be able to point every claim to a source retrieved during that run.

---

## Learning loop: imposed build order

Do not build out of order. The value is in the first 3, not in vectorization.

1. Clean reward tracking. We measure **positive reply** and **meeting**, never opens.
2. Capture of human edit diffs (the preference pair `AI → edited → result`).
3. Playbook distilled per ICP, rewritten by the Analyst (natural language).
4. Retrieval / vectorization, **on the prospect's profile, not on the message text**.
5. Structured stats per categorical attribute.
6. Bandit (Thompson, at the angle level) last, only when the volume exists.

Do not implement 4, 5 or 6 before 1, 2, 3 are solid and tested.

---

## Data model: frozen, do not invent on the fly

Loop tables (see README-moteur.md):

- `messages`: message + categorical attributes (angle, length, CTA type, personalization depth, channel, ICP, sender, time slot).
- `outcomes`: result on the reward scale + attribution window.
- `edits`: diff of each human edit.
- `playbook`: natural-language document per ICP.
- `dossiers`: sourced intelligence, each fact cited.

Business tables: `companies`, `icps`, `leads`, `sequences`.

Any schema evolution goes through a versioned `.sql` migration file, never through an on-the-fly mutation. Do not create an ad hoc table outside this model without an explicit reason.

---

## Agent architecture

Sequential pipeline in the evening, plus one async job. Four steps, not four heavy services.

- Hunter (sourcing) → Profiler (intelligence + qualification + score + channel choice) → Copywriter (writing).
- Analyst: weekly async job, distills the playbook. Outside the evening cycle.
- The strategy (ICP, tone, channels) is frozen at setup, re-injected. It is not an agent that runs.

The evening batch runs via the Redis queue (BullMQ).

---

## Code conventions

### We work per module

Everything lives under `src/modules/<module>/`. A module is autonomous: it shares with the others only what is in `src/shared/`. **A module never imports another module's repository.** Even if a user call already exists elsewhere, we rewrite the repo in the current module. We duplicate, we do not couple.

Anatomy of a module:

```
src/modules/<module>/
  <module>.controller.ts     # Hono router: routes, zod validation, error → HTTP mapping
  <module>.service.ts        # business logic, orchestration, tenant guard
  <module>.module.ts         # composition root: postgres → repo → service → router
  <module>.errors.ts         # one enum per use case (validation message AND return value)
  <module>.constants.ts      # MAX_*, TTL, mime lists `as const`
  <module>.utils.ts          # pure Pg* → *Dto conversion functions
  dto/
    request/<action>.request.ts   # zod schema + inferred type (same name), + index.ts barrel
    response/<thing>.response.ts   # Readonly<{}> type (NO zod on the response side), + index.ts barrel
  repository/<entity>/       # one folder per DB entity, never cross-module
    <entity>.entities.ts     # Pg* types (snake_case), Factory, FactoryInput — all Readonly
    <entity>.postgres.ts     # class: raw SQL postgres.js, try/catch → throwSanitizeError
    <entity>.repository.ts   # class: camelCase API, converts FactoryInput → Factory
    <entity>.utils.ts        # FactoryInput → Factory, id via Bun.randomUUIDv7()
  queue/<job>/               # optional: async jobs (BullMQ) — .entities.ts / .service.ts / .processor.ts
```

Flow: `controller (validates zod) → service (rules + tenant) → repository (camelCase API) → postgres (raw SQL) → DB`, then back `postgres (Pg*, snake_case) → service (utils.convert* → *Dto) → controller → JSON`.

### DTO

- **Request**: an exported `z.object({...})` schema, and its inferred type exported **under the same name** (`export const CreateFolderDto = z.object(...)` then `export type CreateFolderDto = z.infer<typeof CreateFolderDto>`). Each zod error message points to the module's error enum, never a free string. The bounds come from `constants.ts`.
- **Response**: **no zod.** A `type Readonly<{}>`, `ReadonlyArray<>` for lists. Dates are ISO `string` on the DTO side, never `Date`.
- An `index.ts` re-exports each folder (barrel). The controller does `import * as RequestDto`, the service `import type * as ResponseDto`.

### Errors as values, not as exceptions

- **One `enum` per use case** in `<module>.errors.ts`, string-valued members (`invalidName = "invalidName"`). The same enum serves as the zod validation message **and** as the service return value.
- The service returns a `Dto | ErrorEnum` union, it does not `throw` for an expected business failure. `throw`s remain confined to the `postgres` layer (`throwSanitizeError`) and to impossible invariants.
- The controller `switch`es on the result to map each error to an HTTP code via `sendError(context, 4xx, result)`.

### Service

- One class, dependencies injected via the constructor (`private readonly xRepository: XRepository`).
- **Systematic tenant guard**: we load the entity, then `if (entity === null) return X.inexisting...` and `if (entity.org_id !== orgId) return X.notInMyOrg`. No operation without this guard.
- Mapping to the output via `utils.convert*` only, never a DTO built by hand.
- Partial update: conditional spread (`...(dto.name !== undefined && { name: dto.name })`), which depends on `exactOptionalPropertyTypes`.
- Parallelism via `Promise.all([...])`. Infra failures caught, logged (`console.error("[<module>] ...")`), converted to an error enum.

### Repository (no ORM)

Two stacked classes: `Postgres` (raw SQL) wrapped by `Repository` (clean API).

- `entities.ts`: `PgX` = exact shape of the table in **`snake_case`** (`org_id`, `created_at`); `PgXFactory` = what we insert; `XFactoryInput` = the service input in **`camelCase`**. Everything `Readonly`.
- `postgres.ts`: class `constructor(private readonly db: DbClient)`. Each method = a `this.db<ReadonlyArray<PgX>>\`SELECT ...\`` template inside a `try/catch` whose `catch` does `return throwSanitizeError(error)`. `snake_case` columns, `RETURNING *`, first result via `result[ARRAY.FIRST_INDEX] ?? null` (never a hardcoded `[0]`).
- `repository.ts`: class `constructor(private readonly xPostgres: XPostgres)`, methods `getOne*` / `getMany*` / `createOne*` / `updateOne*` / `deleteOne*`, `camelCase` signatures. Converts `FactoryInput → Factory` via `utils` before calling `postgres`.
- **Case boundary**: `snake_case` under `repository/`, `camelCase` everywhere else. The conversion happens in the `utils`, nowhere else.

### Typing, hard

- `strict: true`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals` / `noUnusedParameters`.
- **No `any`, no unjustified `unknown`.** An isolated `as never` is tolerated only for the `db.json(...)` bridge of postgres.js.
- **Everything is immutable**: `Readonly<{}>` for objects, `ReadonlyArray<>` for arrays, `ReadonlyMap<>` for maps. No mutable type exposed.
- **No `for`, no `forEach`.** We use `map` / `filter` / `reduce` / `some` / `Promise.all`. Only exception: a purely imperative iteration where map/filter/reduce makes no sense (performance, I/O, header writing, sequential migrations).
- **No comment.** No JSDoc, no inline, no TODO, no SQL comment. A comment is the sign of code that is not explicit enough: name better, extract a named function.
- IDs via `Bun.randomUUIDv7()`. Explicit `.ts` file imports, `@shared/*` alias for shared code.

### Naming

- DB types prefixed `Pg` (`PgCaseFolder`, `PgCaseFolderFactory`).
- Conversions `convert<Source>To<Cible>Dto`. Error enums `<Action>Errors`. DTO named like its zod schema.

### General

- Multi-tenant: every DB query is scoped to the organization. No query without a tenant filter. This is a security rule, not a preference.
- Secrets and keys (Anthropic API, mail): env variables, never hardcoded, never committed.
- Input validation with zod on all Hono routes.

---

## What we never do

- Automate LinkedIn, WhatsApp, Instagram or voice calls. Auto mode = email only. The other channels produce a draft, the human sends.
- Learn or optimize on opens.
- Vectorize the message text rather than the prospects' profile.
- Write an unsourced fact in a dossier.
- Use a package manager other than Bun.
- Use an ORM or a query builder (Drizzle, Prisma, Kysely…). The SQL is written by hand in the `*.postgres.ts`.
- Import another module's repository. We duplicate the repo in the current module.
- Expose a mutable type, an `any` or an unjustified `unknown`.
- Write a `for`/`forEach` loop where `map`/`filter`/`reduce` suffices.
- Write a comment. The code must be sufficient through naming and structure.

---

## Commands

```
bun install          # dependencies
bun run dev          # dev (--hot)
bun test             # tests
bun run db:migrate   # applies the versioned SQL migrations
```

Adjust the script names to the real package.json, but keep `bun run` in front of everything.
