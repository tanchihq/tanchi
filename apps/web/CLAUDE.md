# CLAUDE.md, front repo Tanchi

Instructions for the code agent on the **front** repo. The back repo is separate and has its own CLAUDE.md.

The WHAT and the WHY of the product are in `README.md` (global product). Read it, especially the interface section, before coding the UI.

---

## Frozen stack, non-negotiable

- **Runtime + package manager + test: Bun. Full Bun.**
- Front: TypeScript, React, Vite.

---

## Bun rules, hard

- **Never npm, never pnpm, never yarn. No exception.**
- Install: `bun install`. Add: `bun add <pkg>`. Remove: `bun remove <pkg>`.
- Run: `bun run <script>` (Vite runs via `bun run dev`).
- Tests: `bun test`. No vitest or jest.
- **Lockfile: `bun.lock` only.** Delete any `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`. Never generate them.

---

## The UI: clean, simple, usable without docs

First-order product requirement. A salesperson opens the app in the evening, validates their queue in 10 minutes, closes.

- **One screen, one job.** The evening dashboard shows the day's leads, their dossier, the proposed message, the state of follow-ups. Nothing more by default.
- **The message review queue is the central screen.** Validate, edit or send a draft in a few seconds. This is where the UX must be flawless. Optimize this flow before everything else.
- **Auto mode is explicit and reversible.** You always see what goes out on its own and what awaits validation. No opaque magic.
- **Guided onboarding.** Company setup + ICP + resources in a linear flow, not a 40-field form in one block.
- Visual sobriety, clear hierarchy, controlled density.

---

## What we never do in the UI

- Expose internal jargon: no "bandit", "vectorization", "reward", "few-shot" on screen. Learnings are shown in plain language: "what works on this ICP right now".
- Let the user believe in auto multi-channel. The UI reflects the truth of channels: auto on email, assisted elsewhere.
- Hide what goes out automatically. Transparency about auto sends is a rule.
- Use a package manager other than Bun.

---

## Code conventions

These conventions are aligned with the `Sweescape/SweeBadge` repo. When a doubt
remains, we go see how it's done over there. The project is meant to become
open source: the code must be exemplary.

### Clarity: no comments

- **No comments in the code.** A comment = an admission that the code isn't
  clear. We make the code clear instead: explicit and simple variable/function/type
  names. Zero `//` and zero `/* */`.

### View & component structure

Modeled on `SweeBadge/src/views/authenticated/event`.

- A view (route) = a folder with **`index.tsx`** (main component, default
  export), **`utils.ts`** for helpers, a **`hooks/`** folder for the
  API calls (one hook per file, `useXxx`, default export, wrapping
  `useAsync`/`useAsyncEvent`).
- Each subcomponent lives in its own **kebab-case** folder (`prospect-card/`)
  with its **PascalCase** file (`ProspectCard.tsx`, default export), and its
  own `utils.ts` / `hooks/` co-located if it has any.
- **Co-location**: what a component uses lives at the same level as it.
  No catch-all `components/` or `data/` folders inside a view.
- **Reusable → moves up to global**: shared components in
  `src/components/`, shared utils/formatting in `src/utils/`.

### Typing: strict and immutable

- **TypeScript strict.** Everything is typed. **Never `any`.** ESLint breaks the build
  on explicit `any` (`@typescript-eslint/no-explicit-any: error`).
- **Never `unknown`**, except in **one single place**: the `catch` clauses (which TS
  forces to `unknown`) and the error sanitizer `throwSanitizeError`, the only
  boundary where the shape of the value is not guaranteed. Everywhere else, we
  type precisely.
- **Immutable everywhere.** Objects and arrays are declared read-only:
  `Readonly<{ ... }>` and `ReadonlyArray<T>`. DTOs, props, state, API
  returns are all immutable.
- Props of a component: `type Properties = Readonly<{ ... }>`.

### Functional style

- **No `for` or `forEach`.** We use `map`, `filter`, `reduce`,
  `find`, etc. Exception only for a real perf reason.
- Functional components + hooks. No classes.
- Arrow functions (`const f = () => ...`), no `function`.

### API layer: organized by module

The back works in **modules**; the front mirrors it. One module per
folder under `src/api/`.

- **One API function = one file** curried, receiving first the axios
  instance, then the data:

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

- **Module entities** in `entities/`: `response.entities.ts` (DTOs, all in
  `Readonly` / `ReadonlyArray`), `request.entities.ts` (payloads), `errors.ts`
  (error enums, one per operation).
- **`src/api/api.ts`** is the single wiring point: it binds the shared axios
  instance to the module functions and re-exports ready-to-use functions
  suffixed `*Axios` (e.g. `getOneCompanyAxios`).
- **`src/api/utils.ts`** contains the axios instance (a single one, the back is a
  single Hono service; modules are route prefixes). Base URL:
  `${import.meta.env.VITE_API_URL}/api/v1`. Cookie auth via Better Auth →
  `withCredentials: true`. Response interceptor for auth errors.
- **Auth exception**: `sign-in` / `sign-out` go through the **Better
  Auth client** (`src/api/auth-client.ts`, `authClient.signIn.email` / `signOut`), not
  through an axios module. The rest (session `/me`, sign-up, the whole domain) stays
  in curried axios modules.
- **Error helper**: `src/api/shared/extract-error.ts` (`throwApiError`) maps
  the back AppError (`message` = code); the hooks switch on this code → toast.
  Shared domain enums in `src/api/shared/enums.ts`.
- **No secret or API key on the front side.**

### API calls: always through a hook

No `fetch`/`axios` called directly in a component. Everything goes through one
of the two in-house hooks (`src/hooks/`):

- **`useAsync`**: loading on component mount (initial fetch of a page).
  Returns `{ data, status, refetch, errorMessage }`.
- **`useAsyncEvent`**: action triggered by the user (submit, click). Does not
  fire on mount. Returns `{ onFetch, isLoading, isError, status, ... }`.

We wrap them in a small dedicated hook per usage, e.g.
`src/views/.../hooks/useRetrieveManyLead.tsx`, which wires `onSuccess`/`onError`
(toasts) and the `*Axios` call.

### UI

- **shadcn/ui + Tailwind CSS v4** (CSS-first config in `src/index.css`,
  theme variables in `oklch`, `@tailwindcss/vite` plugin). Components in
  `src/components/ui/`. **We maximize the use of shadcn components**, customized
  to our needs, for a stable UX/UI.
- **`Button` has an `isLoading` prop**: we wire the `isLoading` of a
  `useAsyncEvent` directly to it → integrated spinner + `disabled`. Every button that triggers
  an API call shows its loading (never the impression that nothing is happening).
- `cn()` (clsx + tailwind-merge) in `src/utils/lib/utils.ts`.
- Icons: **`lucide-react` only** (brand glyphs absent from lucide v1
  → inline SVG in `ChannelIcon`). Toasts: `sonner` (`<Toaster />` mounted in
  `main.tsx`).
- **Forms: `react-hook-form` + `zod` systematically**, with the shadcn
  `Form` component (`Form` / `FormField` / `FormItem` / `FormLabel` / `FormControl` /
  `FormMessage` in `@/components/ui/form`). The **zod schema lives in the `utils.ts`**
  of the view (with the `z.infer` type + the default values), never inline in the
  component. `useForm({ resolver: zodResolver(schema), mode: 'onChange' })`, typed
  errors displayed by `<FormMessage />`, submit `disabled={!form.formState.isValid}`
  + `isLoading`. Dynamic lists via `useFieldArray`.
- **Routing: `react-router-dom`.** Guards by group (public / non-authenticated /
  authenticated) when auth arrives.
- **UI strings in English, hardcoded.** No i18n / Lingui for now.
- **Design system** in `src/index.css`: Tailwind v4 tokens (`@theme`) extracted
  from the product design. Indigo brand `brand-*` (#0501F0), warm neutrals `paper` /
  `sand` / `ink`, dark glass universe `night-*` / `glass-*`, statuses
  `success` / `warn` / `danger`, signature shadows (`shadow-glass`, `shadow-brand`,
  `shadow-well`), radii `rounded-well` (14px) / `rounded-card` (28px). The
  shadcn semantic variables are retuned onto the brand. Reusable glass
  surfaces: classes `.glass-card`, `.glass-well`, `.glass-hairline`.
- Error handling: enums per operation on the API side → `switch` on `error.message`
  in the hook → clear toast for the user.

### Naming & files

- Files and folders: **kebab-case** (`get-one-company.ts`, `lead-queue/`).
- Components: **PascalCase**. Hooks: **`useXxx`**.
- Re-exported API functions: **`{action}{Ressource}Axios`**.
- Import alias: **`@/` → `src/`** (configured in `tsconfig` + `vite`).

---

## Commands

```
bun install     # dependencies
bun run dev     # dev Vite
bun run build   # prod build
bun test        # tests
```
