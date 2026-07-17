# Product Market Updates

An importable **weekly automation** that keeps you on top of your product's market:
competitor moves, your own organization's strategy and releases, and the broader AI
landscape — delivered as a short, prioritized, verifiable digest.

It's a **product-agnostic** scheduled agent prompt. Import it into any surface that
supports scheduled agent automations, then answer a few setup questions and let it
run weekly.

## What it does

Every week (default: Friday 9AM), the automation runs a 6-step pipeline:

1. **Load product context** *(one-time)* — captures your product, industry, competitors, company, and where the product sits in the org. Saved to `market-updates/product-context.md` and reused every run.
2. **Maintain a source registry** — a curated list of *where* to scan (competitor newsrooms/blogs/changelogs, your org's press, industry/analyst media, AI-lab news pages, and standing search queries). Stored in `market-updates/source-registry.md`.
3. **Scan the past 7 days** — competitor updates, your org's updates, and AI-landscape releases from major AI players and notable startups.
4. **Verify, dedupe & compare against history** — every item must have a real source, link, and date or it's dropped; the same story across multiple outlets is merged into one; and anything already reported in prior weeks (tracked in `market-updates/reported-items.md`) is excluded. Survivors are tagged **New** or **Still developing**.
5. **Summarize** into a fixed, scannable template.
6. **Update the run ledger** — appends what was reported so next week can dedup.

### Output digest sections

| Section | Contents |
|---|---|
| **Competitor Moves** | Announcements, releases, strategy/pricing changes (New / Still developing) |
| **Your Org & Strategy** | Relevant news from your own company |
| **AI Landscape** | New models & major platform/feature releases |
| **Why It Matters to \<product\>** | 2–4 point synthesis of the most consequential implications |
| **Watch List** | Threads to monitor next week |

Every item is a one-liner with an **urgency tag** (RED = act now / YELLOW = watch /
WHITE = FYI), a one-line "so what" implication for your product, and its **source,
date, and link**.

## State files

The automation maintains a `market-updates/` folder in its working directory:

| File | Role |
|---|---|
| `product-context.md` | *What* to look for (written once at setup) |
| `source-registry.md` | *Where* to scan (you curate this) |
| `reported-items.md` | Run history — powers cross-week dedup (append-only) |

The automation creates these files on first run.

## How to import

The importable config is [`product-market-updates.automation.json`](./product-market-updates.automation.json).

Use your automation surface's **"import automation"** (or "scheduled prompt") flow
and select that JSON file. It's known to work with surfaces such as **Microsoft
Scout** and **Cowork**, and should import into any tool that accepts a scheduled
multi-step agent prompt.

- Review the schedule (default: weekly, Friday 9AM) and the six step prompts.
- The config ships with `"enabled": false`, so it won't run until you turn it on.
- On the **first run** the automation walks you through product-context setup and
  proposes an initial source registry — confirm both, and subsequent runs are fully
  unattended.

## Configuration

Edit the JSON to change behavior:

- **Schedule** — the `schedule` block (default: weekly, Friday 9AM).
- **Model** — the `model` field.
- **Notifications** — the `teamsNotify` field.
- **Step prompts** — each of the six `steps[].prompt` values; tune wording, add
  urgency rules, or adjust sections.

Some fields (e.g. `model`, `teamsNotify`, `browserHeadless`) follow one surface's
schema — adjust or drop them to match the surface you import into.

Tune *where* it looks by editing `market-updates/source-registry.md`, and *what* it
looks for by editing `market-updates/product-context.md`.

## Guardrails

All information must be real and verified. Do not invent data, file paths, or URLs.
Every reference in the digest must come from an actual source, with a working link
and publication date — unverifiable items are dropped, and single-source claims are
marked "unconfirmed."
