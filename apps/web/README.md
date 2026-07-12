# Tanchi

> Autonomous B2B prospecting engine, open source, self-hostable. The AI sources, researches, writes and follows up every evening. You keep control over sending. The system learns from what actually converts, not from what looks nice.

---

## The thesis

Most AI prospecting tools sell two lies: "full auto multi-channel" (in reality only email can be automated cleanly) and "the AI learns from your results" (in reality, at low volume, they optimize on opens, a garbage signal).

Tanchi takes the opposite stance:

- **Email-first.** The other channels in assisted mode (the AI writes, the human sends).
- **Prospect research** treated as a full-fledged verification pipeline.
- **Qualitative distilled learning** before being statistical. Interpretable, correctable, effective from the very first month.
- **Human + AI collaboration** leveraged as the primary signal, not thrown away.

The engine details (sourcing, research, agents, learning) are in **[README-moteur.md](./README-moteur.md)**. It's the core of the project.

Built first for internal use (Sweescape), designed to be opened up.

---

## What the tool does

1. **Company setup.** Company, 1 to 3 ICPs, resources provided (website, product doc, brochure, client cases). Knowledge base for the agents.
2. **Channel setup.** Activation per channel, with each one's real capacity displayed honestly.
3. **Daily sourcing.** Every evening, new qualified leads on the ICPs.
4. **Research + channel choice.** Sourced dossier per lead, most relevant channel chosen.
5. **Writing.** Personalized message, fed by past winning hooks.
6. **Sending.** Auto on email if the lead is in "auto" mode. Otherwise a draft ready to validate.
7. **Tracking and follow-ups.** State of each prospect tracked, follow-ups scheduled in the evening cycle.
8. **Learning.** Distillation of what converts per ICP, reinjected into the writing.

---

## The interface: clean, simple, immediately usable

A first-order product requirement, not a cosmetic detail. The tool must be usable without docs.

- **One screen, one job.** Setup, then a daily dashboard showing the evening's leads, their dossier, the proposed message, and the state of follow-ups. Nothing more on screen by default.
- **Message review is the central action.** A queue of drafts to validate, edit or send, each in a few seconds. This is where the human spends their time, so this is where the UX must be flawless.
- **Auto mode is explicit and reversible.** You always see what goes out on its own and what awaits validation. No opaque magic.
- **Zero jargon in the UI.** No "bandit", no "vectorization" exposed. The learnings are shown in plain language ("what works on this ICP right now").
- **Guided onboarding.** Company setup + ICP + resources in a linear flow, not a panel of 40 fields.

Visual sobriety, clear hierarchy, controlled density. The goal: a salesperson opens the app in the evening, validates their queue in 10 minutes, closes it.

---

## The channels: real capacity

Honesty on this point is a deliberate product choice in the UI.

| Channel | Auto | Reality |
|---|---|---|
| **Email** | Yes | The only one that's truly automatable. Legal cold B2B in FR (identification + opt-out). Priority channel. |
| **LinkedIn** | No | Automation = User Agreement violation, ban. Assisted draft + manual sending. |
| **WhatsApp** | No | Official API: opt-in + templates. Unofficial libs: burned number. |
| **Instagram** | No | ToS + rate limits + ban. Assisted draft. |
| **SMS** | Partial | Depending on provider and opt-in compliance. |
| **Cold call** | No | Generated script + call log. No voice agent. |

**"Auto" mode = email only.** For the rest, the AI writes, the human sends.

---

## Emailing

V1 approach, simple and direct: we go through the **salesperson's or salespeople's mail server**. Emails go out from their own address, not from a third-party domain. It's simpler to set up and better for deliverability and credibility.

**Warm-up.** A progressive ramp-up system needs to be planned: an account that suddenly starts sending volume gets flagged. Warm-up builds the address's reputation before ramping up the cadences. To integrate early, even in a simple version (gradual increase in the number of sends/day).

The other channels are not automatic (see table).

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
- PostgreSQL (business data)
- Redis (queues and evening batches)

**AI**
- Anthropic API, or CLI depending on config (see below)

**Search**
- `web_fetch` prioritized over `web_search` for dossier verification

**Emailing**
- Salesperson's mail server, progressive warm-up

---

## AI configuration: CLI or API key

When creating the account, you choose:

- **Self-hosted:** the user's API key. Recommended, the nightly batch runs on it.
- **Hosted SaaS:** our own API with usage billing.

Note: a Max-type subscription via interactive CLI is not made for nightly server batches. Self-hosted = API key.

---

## Self-hosted vs SaaS

- **Open source, self-hosted, free.** You plug in your key, you host, you take responsibility for your compliance and your sourcing.
- **Hosted SaaS, paid.** Managed usage, billing, updates. Model for billed internal use and for resale.

---

## Roadmap

**V1**
- Company setup + ICP + resources
- Evening sourcing + verified research pipeline
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

Pre-alpha. Internal Sweescape use first. Public opening once the conversion loop is proven on real data.
