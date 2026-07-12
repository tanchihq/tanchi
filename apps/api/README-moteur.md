# Tanchi, the engine

> The heart of the product: how we source, how we gather intelligence, and how we learn from what actually converts. This is where the difference with other AI prospecting tools plays out.

This document describes three building blocks: **sourcing and intelligence**, the **agents**, and **learning**. They loop into each other, and that's the whole story.

---

## 1. Sourcing and intelligence

Two distinct steps that are often conflated: finding the leads, then knowing them. The second is the one that drives conversion.

### 1.1 Sourcing

Every evening, a job identifies new leads based on the configured ICPs. The ICPs serve as seeds: we start from archetypal profiles and look for similar profiles across the channel-relevant sources.

Sourcing produces a raw list. It doesn't judge yet, it rakes. Qualification comes after.

### 1.2 Intelligence

This is a **verification pipeline**, not a generation. Quality comes from the rigor of the sources, never from the model. It's the most important point of the product.

**Hard rules, non-negotiable:**

- Every fact in the dossier is cited and sourced.
- Never a name, a logo, or a client that doesn't appear on the prospect's own website or LinkedIn.
- `web_fetch` of the real website always takes precedence over `web_search`.
- An unverified piece of data does not enter the dossier. No "probably", no unsourced inference.

**The dossier pipeline:**

1. Multi-source collection: website, LinkedIn, recent press, ongoing event, fundraising, hires, tech stack.
2. Structured extraction, each fact attached to its source.
3. Synthesis into a readable dossier.
4. Proposal of 3 to 5 candidate hooks, ranked, each tied to a verified fact.

**Output:** a prospect dossier where each hook answers "why this prospect, now, with this angle".

### 1.3 The bridge to learning

Intelligence produces **hook types** (recent event, fundraising, hiring, shared connection, local social proof). These types are the unit that learning measures on. Intelligence doesn't just feed the writing, it feeds the learning loop. The two loop together.

---

## 2. The agents

Four steps, not four brains. Internally it's a sequential pipeline plus an async job. On the presentation side, we can name them as four agents.

### Hunter, sourcing

Rakes leads on the ICPs, every evening. Outputs a raw list of candidates.

### Profiler, intelligence and qualification

The most important. For each lead: runs the verified intelligence pipeline, qualifies (A / B / C), scores, chooses the most relevant channel, produces the sourced dossier with its candidate hooks. Every evening.

### Copywriter, writing

Writes the message. Fed by three things: the Profiler's dossier, the ICP's distilled playbook, and the few-shots of past winning hooks for this type of prospect. Every evening.

### Analyst, learning

Doesn't run in the evening cycle. Async job, low frequency (weekly). It distills what converted and rewrites the playbook. It's the one that makes the whole system progress.

**The strategy layer is not an agent.** ICP, tone, channels: frozen at setup, re-injected everywhere. Not a brain that runs every night.

```
      SETUP (frozen strategy: ICP, tone, channels)
                    |
 EVENING ┌──────────┴──────────┐
         Hunter → Profiler → Copywriter → send / draft
                    |              ↑
                 dossier        playbook + few-shots
                    |              |
   ASYNC        (results)       Analyst (distillation, weekly)
                    └──────────────┘
```

---

## 3. Learning

The hardest and most poorly done subject on the market. Our approach: qualitative and distilled first, statistical only when the volume exists.

### 3.1 Learning on the right signal

The reward scale, from noisiest to truest:

```
sent  →  delivered  →  opened  →  replied  →  positive reply  →  meeting booked  →  deal
```

We **don't learn before "positive reply"**. Opens are a garbage signal: Apple Mail Privacy inflates the rates, security bots open everything. Optimizing on them leads to clickbait subject lines that don't convert. The reward we exploit is **positive reply** and **meeting**.

### 3.2 Why not statistical ML right away

The volume math settles the debate. At 30 emails/evening, 5-10% reply, 1-2% positive, we harvest 0 to 1 positive reply per night. For statistical significance on a rate of a few %, you need hundreds of sends per variant. We won't have that volume per ICP for months.

Conclusion: statistical learning is dead on arrival at the start. Ours must be **qualitative and distilled** first.

### 3.3 The four layers, by real value

**Layer 1, distillation (the core).** The Analyst receives the batches `message sent → possible human edit → result` and rewrites a **natural-language playbook, per ICP**:

> "Nightlife: the local social proof hook produced 4 replies, the generic ones 0. Winning angle: cite a recent event of the prospect from the 1st line."

This playbook is re-injected into the Copywriter's prompt. Interpretable, correctable by hand, effective at low volume. That's what real learning is.

**Layer 2, structured stats.** Each message is tagged on categorical attributes: angle (pain / social proof / curiosity / shared connection), length, CTA type, personalization depth, channel, ICP, sender, time slot. We track the positive reply rate **per attribute value**, not per free text. Aggregating over 6 to 8 dimensions is exploitable far sooner than a true statistical test. It feeds layer 1 with numbers.

**Layer 3, retrieval (the vectorization).** Serves the few-shot. At writing time, we retrieve the k past winning messages and put them as examples. Key point: **we vectorize the prospect's profile, not the message text.** The useful axis is "for this type of prospect, which hooks worked", not "which messages resemble each other". The classic mistake produces survivorship bias on style.

**Layer 4, bandit (later).** When the volume exists: Thompson sampling at the **angle** level (4-5 arms max), never at the message level. Not before having the data, otherwise we exploit noise.

### 3.4 The most valuable signal: human + AI

Field observation: the `AI edited by human` version often converts better than full auto.

Each human edit of a draft produces a **preference pair**: `AI version → edited version → result`. Most tools throw it away. Tanchi stores it and makes it the Analyst's **learning priority**.

In practice, what the human adds is almost always **the prospect-specific insight**, so intelligence. The loop closes: the better we gather intelligence, the less the human needs to edit, and what they edit anyway becomes the next lesson.

### 3.5 Build order

1. Clean reward tracking (positive reply detected, not open).
2. Capture of human edit diffs.
3. Distilled playbook per ICP.
4. Then retrieval (profile vectorization).
5. Then structured stats.
6. Bandit last, once the volume is reached.

---

## Data model of the loop (sketch)

- **`messages`** : the message + all its categorical attributes.
- **`outcomes`** : result on the reward scale, with attribution window.
- **`edits`** : diff of each human edit (the preference pair).
- **`playbook`** : natural-language document per ICP, rewritten by the Analyst.
- **`dossiers`** : sourced intelligence, each fact cited.

---

## Guiding principle

Intelligence first, the algorithm second. Never learn from a signal we can't measure cleanly. Distill from the field, not from opens.
