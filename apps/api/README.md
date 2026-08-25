# Tanchi

> Autonomous B2B prospecting engine, open source, self-hostable. The AI sources, researches, writes, and follows up every evening. You keep control over sending. The system learns from what actually converts, not from what looks nice.

---

## The thesis

Most AI prospecting tools sell two lies: "full auto multi-channel" (in reality, only email is cleanly automatable) and "the AI learns from your results" (in reality, at low volume, they optimize on opens, a junk signal).

Tanchi takes the opposite stance:

- **Email-first.** The other channels in assisted mode (the AI writes, the human sends).
- **Prospect intelligence** treated as a full-fledged verification pipeline.
- **Qualitative distilled learning** before being statistical. Interpretable, correctable, effective from the very first month.
- **Human + AI collaboration** leveraged as the main signal, not thrown away.

The engine details (sourcing, intelligence, agents, learning) are in **[README-moteur.md](./README-moteur.md)**. It is the heart of the project.

Built first for internal use (Sweescape), designed to be opened up.

---

## What the tool does

1. **Company setup.** Company, 1 to 3 ICPs, provided resources (website, product doc, brochure, customer cases). Knowledge base for the agents.
2. **Channel setup.** Activation per channel, with each one's real capacity displayed honestly.
3. **Daily sourcing.** Every evening, new qualified leads on the ICPs.
4. **Intelligence + channel choice.** Sourced dossier per lead, most relevant channel chosen.
5. **Writing.** Personalized message, fed by past winning hooks.
6. **Sending.** Auto on email if the lead is in "auto" mode. Otherwise a draft ready to validate.
7. **Tracking and follow-ups.** State of each prospect tracked, follow-ups scheduled in the evening cycle.
8. **Learning.** Distillation of what converts per ICP, reinjected into the writing.

---

## The interface: clean, simple, immediately usable

A first-order product requirement, not a cosmetic detail. The tool must be usable without documentation.

- **One screen, one job.** Setup, then a daily dashboard that shows the evening's leads, their dossier, the proposed message, and the state of follow-ups. Nothing more on screen by default.
- **Message review is the central action.** A queue of drafts to validate, edit, or send, each in a few seconds. This is where the human spends their time, so this is where the UX must be flawless.
- **Auto mode is explicit and reversible.** You always see what goes out on its own and what awaits validation. No opaque magic.
- **Zero jargon in the UI.** No "bandit," no "vectorization" exposed. The learnings are shown in plain language ("what works on this ICP right now").
- **Guided onboarding.** Company setup + ICP + resources in a linear flow, not a panel of 40 fields.

Visual restraint, clear hierarchy, controlled density. The goal: a salesperson opens the app in the evening, validates their queue in 10 minutes, closes it.

---

## The channels: real capacity

Honesty on this point is a deliberate product choice in the UI.

| Channel | Auto | Reality |
|---|---|---|
| **Email** | Yes | The only truly automatable one. Cold B2B legal in FR (identification + opt-out). Priority channel. |
| **LinkedIn** | No | Automation = User Agreement violation, ban. Assisted draft + manual sending. |
| **WhatsApp** | No | Official API: opt-in + templates. Unofficial libs: burned number. |
| **Instagram** | No | ToS + rate limits + ban. Assisted draft. |
| **SMS** | Partial | Depending on provider and opt-in compliance. |
| **Cold call** | No | Generated script + call log. No voice agent. |

**"Auto" mode = email only.** For the rest, the AI writes, the human sends.

---

## Emailing

V1 approach, simple and direct: we go through the **salesperson's (or salespeople's) mail server**. Emails go out from their own address, not from a third-party domain. It is simpler to set up and better for deliverability and credibility.

**Warm-up.** A progressive ramp-up system is to be planned: an account that suddenly starts sending volume gets flagged. The warm-up warms the address's reputation before ramping up cadences. To be integrated early, even in a simple version (gradual increase in the number of sends/day).

The other channels are not automatic (see table).

### System mailer (transactional)

Not to be confused with the outreach sending above: **system** emails (account verification, invitations) go out from a separate mailer. **Resend is not imposed** — the resolution order:

1. **Generic SMTP** if `MAIL_SMTP_HOST` is defined (`MAIL_SMTP_PORT`, `MAIL_SMTP_USER`, `MAIL_SMTP_PASS`, `MAIL_SMTP_SECURE`). **Recommended in self-hosted.**
2. **Resend** if `RESEND_API_KEY` is defined (SaaS option, not required).
3. Otherwise: no sending, log to console (dev).

The sending address is `MAIL_FROM_EMAIL` (generic). `RESEND_FROM_EMAIL` is still accepted and takes priority if defined (backward compatibility). A self-hoster therefore plugs in their own SMTP + `MAIL_FROM_EMAIL`, without ever touching Resend.

---

## Stack

**Front**
- TypeScript
- React
- Vite

**Back**
- Hono (TS)

**Auth**
- Better Auth (multi-tenant)

**Data**
- PostgreSQL (business data), accessed with raw SQL via `postgres.js` — **no ORM**
- Redis (queues and evening batches)

**AI**
- Claude by default (Anthropic API, or the CLI in local dev)
- Self-hosted can swap in GPT (OpenAI), Gemini (Google) or Kimi (Moonshot) — see below

**Search**
- `web_fetch` prioritized over `web_search` for dossier verification

**Emailing**
- Salesperson's mail server, progressive warm-up

---

## AI configuration: provider and key

When creating the account, you choose:

- **Self-hosted:** the user's API key. Recommended, the nightly batch runs on it.
- **Hosted SaaS:** our own API with usage billing.

Note: a Max-type subscription via interactive CLI is not meant for nightly server batches. Self-hosted = API key.

### Choosing the provider (self-hosted)

`LLM_PROVIDER` accepts `cli`, `api`, `anthropic`, `openai`, `gemini` or `kimi`.
`api` is an alias of `anthropic` and stays the default for the hosted product.

| Provider | Auth | Web research |
|---|---|---|
| `anthropic` / `api` | `ANTHROPIC_API_KEY` | native (`web_search`) |
| `cli` | local Claude CLI | native (`WebSearch` / `WebFetch`) |
| `openai` | `OPENAI_API_KEY` | native (Responses API `web_search`) |
| `gemini` | `GEMINI_API_KEY` | native (`google_search` grounding) |
| `kimi` | `MOONSHOT_API_KEY` | native (`$web_search` builtin) — see caveat |

`OPENAI_BASE_URL` and `MOONSHOT_BASE_URL` let you point at a compatible gateway.

**One provider, one key.** Exactly one provider is instantiated at boot, and it
reads only its own variable — bring your Gemini key and nothing else is needed.
Moonshot publishes an OpenAI-compatible endpoint, so Kimi and OpenAI share the
same HTTP transport in `openai-compatible.ts`; that is a wire format they both
speak, not a dependency. A Kimi deployment never touches an OpenAI account.

### API key or CLI?

**The non-Anthropic providers are API-key only.** `cli` is Claude-specific: it
spawns the `claude` binary and speaks its stream format. There is no
`LLM_PROVIDER=codex` or `gemini-cli` — wiring a vendor CLI means writing a full
`LlmProvider` for it (its own tool model, its own streamed output), not just
swapping a binary name.

That is deliberate for a server deployment: a vendor CLI is backed by an
interactive subscription with periodic OAuth re-auth, which does not suit a
nightly batch running with nobody at the keyboard. Self-hosted on a server =
API key.

### Web research is not optional

The Hunter and the Profiler source every fact in a dossier through `research()`,
so every provider here ships a native web search. If a future provider does not,
the API still serves HTTP but **the intelligence engine refuses to start** and
says so in the logs — a dossier carrying facts we cannot trace to a source is
worse than no dossier, and that is invariant #1.

#### Caveat on Kimi

Kimi's search works and is wired in, but Moonshot itself flags the feature as
being reworked and not recommended for production. Expect it to be **less
reliable than Anthropic, OpenAI or Gemini** on sourcing quality and coverage.
If a Kimi deployment produces thin dossiers, point research elsewhere while
keeping Kimi for writing:

```
LLM_PROVIDER=kimi
MOONSHOT_API_KEY=...
LLM_RESEARCH_PROVIDER=gemini
GEMINI_API_KEY=...
```

### Model per agent (self-hosted)

Each agent has a default model per provider, chosen for its cost/quality ratio:

| Agent | `anthropic` | `openai` | `gemini` | `kimi` |
|---|---|---|---|---|
| Hunter (sourcing) | `claude-sonnet-5` | `gpt-5.6-terra` | `gemini-3.7-flash` | `kimi-k3` |
| Profiler (intelligence) | `claude-opus-4-8` | `gpt-5.6-sol` | `gemini-3.1-pro-preview` | `kimi-k3` |
| Copywriter (writing) | `claude-sonnet-5` | `gpt-5.6-terra` | `gemini-3.7-flash` | `kimi-k3` |
| Analyst (learning) | `claude-sonnet-5` | `gpt-5.6-terra` | `gemini-3.7-flash` | `kimi-k3` |
| Reward (response classif) | `claude-haiku-4-5` | `gpt-5.6-luna` | `gemini-3.5-flash-lite` | `kimi-k3` |
| Chat (copilot) | `claude-sonnet-5` | `gpt-5.6-terra` | `gemini-3.7-flash` | `kimi-k3` |

In self-hosted, you override any agent via environment variable (otherwise the default applies):

```
LLM_MODEL_CHASSEUR=claude-opus-4-8
LLM_MODEL_PROFILER=claude-sonnet-5
LLM_MODEL_COPYWRITER=claude-sonnet-5
LLM_MODEL_ANALYSTE=claude-sonnet-5
LLM_MODEL_REWARD=claude-haiku-4-5
LLM_MODEL_CHAT=claude-sonnet-5
```

An ID that does not belong to the active provider's list is ignored (fallback
to that provider's default). The lists live in `src/shared/llm/models.ts`.

Settings → Intelligence shows the active provider and the model per job,
read-only: the choice belongs to whoever runs the instance.

---

## Self-hosted vs SaaS

- **Open source, self-hosted, free.** You plug in your key, you host, you take on your own compliance and sourcing.
- **Hosted SaaS, paid.** Managed usage, billing, updates. Model for billed internal use and for resale.

### Billing (hosted offering)

Billing is entirely opt-in via `BILLING_ENABLED` (default `false`). Self-hosted instances never touch Stripe and run without any limit.

When enabled (`BILLING_ENABLED=true` + `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SOLO_PRICE_ID`):

- **One plan, Solo** — 300 leads processed/month, 1 seat, 1 sender, 3 ICPs, 500 copilot messages/month. Limits live in `src/shared/billing/constants.ts`; the price lives on the Stripe price (`STRIPE_SOLO_PRICE_ID`).
- **14-day trial, no card** — starts at organization creation, capped at 50 leads and 50 copilot messages.
- **On expiry: read-only + engine stopped.** Nightly runs, manual runs and follow-up drafting skip the org; the copilot and new senders are blocked. Data, the review queue and sending already-drafted messages stay available. Nothing is deleted.
- Subscriptions are handled by the `@better-auth/stripe` plugin (checkout, webhook at `/api/v1/auth/stripe/webhook`, `subscription` table keyed on the organization id). Monthly usage is tracked in `usage_counters` and enforced in the engine (Hunter cap), chat and senders services.

Point the Stripe webhook at `https://<api-domain>/api/v1/auth/stripe/webhook` with the events `checkout.session.completed`, `customer.subscription.updated` and `customer.subscription.deleted`.

---

## Roadmap

**V1**
- Company setup + ICP + resources
- Evening sourcing + verified intelligence pipeline
- Email writing + auto sending (email only)
- Emailing via salesperson's server + simple warm-up
- Tracking + follow-ups
- Clean reward tracking, capture of edit diffs, playbook distilled per ICP
- Clean interface, guided onboarding

**V2**
- Retrieval / vectorization on prospect profile
- Structured stats per attribute
- Assisted channels (LinkedIn, WhatsApp draft)

**V3**
- Bandit on the angle once volume is reached
- Hardened multi-tenancy for resale
- Reinforced GDPR compliance for external use

---

## Status

Pre-alpha. Sweescape internal use first. Public opening once the conversion loop is proven on real data.
