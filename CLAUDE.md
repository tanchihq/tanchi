# CLAUDE.md, repo front SweeLeads

Instructions pour l'agent de code sur le repo **front**. Le repo back est séparé et a son propre CLAUDE.md.

Le QUOI et le POURQUOI du produit sont dans `README.md` (produit global). Lis-le, surtout la section interface, avant de coder l'UI.

---

## Stack figée, non négociable

- **Runtime + package manager + test : Bun. Full Bun.**
- Front : TypeScript, React, Vite.

---

## Règles Bun, dures

- **Jamais npm, jamais pnpm, jamais yarn. Aucune exception.**
- Installer : `bun install`. Ajouter : `bun add <pkg>`. Retirer : `bun remove <pkg>`.
- Lancer : `bun run <script>` (Vite tourne via `bun run dev`).
- Tests : `bun test`. Pas de vitest ni jest.
- **Lockfile : `bun.lock` uniquement.** Supprime tout `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`. Ne les génère jamais.

---

## L'UI : épurée, simple, prise en main sans doc

Exigence produit de premier ordre. Un commercial ouvre l'appli le soir, valide sa file en 10 minutes, ferme.

- **Un écran, un job.** Le dashboard du soir montre les leads du jour, leur dossier, le message proposé, l'état des relances. Rien de plus par défaut.
- **La file de revue de messages est l'écran central.** Valider, éditer ou envoyer un draft en quelques secondes. C'est là que l'UX doit être irréprochable. Optimise ce parcours avant tout le reste.
- **Le mode auto est explicite et réversible.** On voit toujours ce qui part seul et ce qui attend validation. Aucune magie opaque.
- **Onboarding guidé.** Setup entreprise + ICP + ressources en parcours linéaire, pas un formulaire de 40 champs d'un bloc.
- Sobriété visuelle, hiérarchie claire, densité maîtrisée.

---

## Ce qu'on ne fait jamais dans l'UI

- Exposer le jargon interne : pas de "bandit", "vectorisation", "reward", "few-shot" à l'écran. Les enseignements se montrent en clair : "ce qui marche sur cet ICP en ce moment".
- Laisser croire à un multi-canal auto. L'UI reflète la vérité des canaux : auto sur email, assisté ailleurs.
- Cacher ce qui part en automatique. La transparence sur les envois auto est une règle.
- Utiliser un autre gestionnaire de paquets que Bun.

---

## Conventions de code

Ces conventions sont alignées sur le repo `Sweescape/SweeBadge`. Quand un doute
subsiste, on va voir comment c'est fait là-bas.

### Typage : strict et immuable

- **TypeScript strict.** Tout est typé. **Jamais `any`.** ESLint casse le build
  sur `any` explicite (`@typescript-eslint/no-explicit-any: error`).
- **Jamais `unknown`**, sauf à **un seul endroit** : les clauses `catch` (que TS
  force en `unknown`) et le sanitizer d'erreur `throwSanitizeError`, seule
  frontière où la forme de la valeur n'est pas garantie. Partout ailleurs, on
  type précisément.
- **Immuable partout.** Les objets et tableaux se déclarent en lecture seule :
  `Readonly<{ ... }>` et `ReadonlyArray<T>`. Les DTOs, props, state, retours
  d'API sont tous immuables.
- Props d'un composant : `type Properties = Readonly<{ ... }>`.

### Style fonctionnel

- **Pas de `for` ni de `forEach`.** On utilise `map`, `filter`, `reduce`,
  `find`, etc. Exception tolérée uniquement pour une raison de perf réelle et
  justifiée par un commentaire.
- Composants fonctionnels + hooks. Pas de classes.
- Fonctions fléchées (`const f = () => ...`), pas de `function`.

### Couche API : rangée par module

Le back fonctionne en **modules** ; le front en est le miroir. Un module par
dossier sous `src/api/`.

- **Une fonction API = un fichier** curryfié qui reçoit d'abord l'instance
  axios, puis les données :

  ```ts
  // src/api/company/get-one-company.ts
  import { AxiosError, type AxiosInstance } from 'axios';
  import { throwSanitizeError } from '@/utils/lib/utils';
  import { GetOneCompanyErrors } from './entities/errors';
  import { type CompanyDto } from './entities/response.entities';

  const getOneCompany =
    (axios: AxiosInstance) =>
    async (companyId: string): Promise<CompanyDto> => {
      try {
        const response = await axios.get<CompanyDto>(`/company/${companyId}`);
        return response.data;
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          switch (error.response?.data.message) {
            case 'inexistingCompany':
              return throwSanitizeError(GetOneCompanyErrors.inexistingCompany);
            default:
              throw new Error((error as Error).message);
          }
        }
        throw new Error((error as Error).message);
      }
    };

  export { getOneCompany };
  ```

- **Entités du module** dans `entities/` : `response.entities.ts` (DTOs, tous en
  `Readonly` / `ReadonlyArray`), `request.entities.ts` (payloads), `errors.ts`
  (enums d'erreurs, une par opération).
- **`src/api/api.ts`** est le point de câblage unique : il lie l'instance axios
  partagée aux fonctions du module et réexporte des fonctions prêtes à l'emploi
  suffixées `*Axios` (ex. `getOneCompanyAxios`).
- **`src/api/utils.ts`** contient l'instance axios (une seule, le back est un
  seul service Hono ; les modules sont des préfixes de route). Auth par cookie
  via Better Auth → `withCredentials: true`. Intercepteur de réponse pour les
  erreurs d'auth.
- **Aucun secret ni clé API côté front.**

### Appels API : toujours via un hook

Aucun `fetch`/`axios` appelé directement dans un composant. Tout passe par l'un
des deux hooks maison (`src/hooks/`) :

- **`useAsync`** : chargement au montage du composant (fetch initial d'une page).
  Retourne `{ data, status, refetch, errorMessage }`.
- **`useAsyncEvent`** : action déclenchée par l'utilisateur (submit, clic). Ne
  part pas au montage. Retourne `{ onFetch, isLoading, isError, status, ... }`.

On les enveloppe dans un petit hook dédié par usage, ex.
`src/views/.../hooks/useRetrieveManyLead.tsx`, qui branche `onSuccess`/`onError`
(toasts) et l'appel `*Axios`.

### UI

- **shadcn/ui + Tailwind CSS v4** (config CSS-first dans `src/index.css`,
  variables de thème en `oklch`, plugin `@tailwindcss/vite`). Composants dans
  `src/components/ui/`.
- `cn()` (clsx + tailwind-merge) dans `src/utils/lib/utils.ts`.
- Icônes : `lucide-react`. Toasts : `sonner` (`<Toaster />` monté dans
  `main.tsx`). Formulaires : `react-hook-form` + `zod` + `@hookform/resolvers`.
- **Routing : `react-router-dom`.** Guards par groupe (public / non-authentifié /
  authentifié) quand l'auth arrivera.
- **Strings de l'UI en anglais, en dur.** Pas de i18n / Lingui pour l'instant.
- **Design system** dans `src/index.css` : tokens Tailwind v4 (`@theme`) extraits
  du design produit. Marque indigo `brand-*` (#0501F0), neutres chauds `paper` /
  `sand` / `ink`, univers verre sombre `night-*` / `glass-*`, statuts
  `success` / `warn` / `danger`, ombres signature (`shadow-glass`, `shadow-brand`,
  `shadow-well`), rayons `rounded-well` (14px) / `rounded-card` (28px). Les
  variables sémantiques shadcn sont retunées sur la marque. Surfaces verre
  réutilisables : classes `.glass-card`, `.glass-well`, `.glass-hairline`.
- Gestion d'erreur : enums par opération côté API → `switch` sur `error.message`
  dans le hook → toast clair pour l'utilisateur.

### Nommage & fichiers

- Fichiers et dossiers : **kebab-case** (`get-one-company.ts`, `lead-queue/`).
- Composants : **PascalCase**. Hooks : **`useXxx`**.
- Fonctions API réexportées : **`{action}{Ressource}Axios`**.
- Alias d'import : **`@/` → `src/`** (configuré dans `tsconfig` + `vite`).

---

## Commandes

```
bun install     # dépendances
bun run dev     # dev Vite
bun run build   # build prod
bun test        # tests
```
