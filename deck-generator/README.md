# Deck Generator Skill

Generate a professional, **product-neutral** monthly telemetry / growth deck for
**any product** from **any dashboard or data source**.

This is a fully generalized growth deck: a shared Fluent-style visual system, but
nothing is hard-coded to a product. A config file describes the slides; one generic
renderer builds the `.pptx`.

## Files

| File | Role |
|------|------|
| `SKILL.md` | The interactive skill protocol (introduce → discover sources → pick metrics → collect → render). |
| `growth-taxonomy.md` | The universal, product-neutral metric lens (7 growth dimensions) + a worked example of mapping product-specific metrics onto it. |
| `generate-deck.js` | The config-driven renderer. Reads a `deck-config.json`, writes a `.pptx`. |
| `deck-config.schema.md` | Full schema for `deck-config.json` (all slide block types + fields). |
| `examples/deck-config.example.json` | A complete, product-neutral sample exercising every slide type. |

## Quick start

```bash
npm install pptxgenjs
node generate-deck.js examples/deck-config.example.json "Acme Cloud Telemetry - May 2026.pptx"
```

## How it works

The **first run is interactive** (see `SKILL.md`) and walks these steps, asking one
focused question at a time:

1. **Basics** — product/deck name, reporting period, and working folder.
2. **Discover data sources** — which dashboards/tools/files to pull from. It pulls via,
   in order: files already in the folder → any available browser/MCP tools → a small
   fetch script generated on the fly per source → asking you. It ships no connectors.
3. **Choose metrics** — walks 7 product-growth dimensions (reach, customer health,
   engagement, quality, value, satisfaction, operational health). You name the metrics,
   or it inspects the dashboard and proposes options — then translates each into
   **product-neutral language** (customers, users, quality, feedback — no vendor jargon).
4. **Product events** — asks about launches/deprecations/pricing changes + dates, to
   build an "impact since launch" slide.
5. **Collect data** — current value plus the last 2–3 periods for trend charts. Missing
   values stay `N/A` — never estimated.
6. **Build & render** — assembles a `deck-config.json`, prints an **outline** to confirm,
   runs an automatic **preflight** (flags declines, missing/placeholder values, month
   gaps, un-cited slides), then renders the `.pptx`.
7. **Comparison basis** — asks once (MoM / QoQ / YoY / baseline) and reuses it thereafter.

Every build also saves all deck data to a per-product store (`data/<product>.metrics.json`)
so the deck can be regenerated and **any number in it queried later** via `query-metrics.js`
— the skill answers from the store instead of guessing.

### What you (the human) do

- Answer the setup questions (name, period, sources, comparison basis).
- **Approve anything that logs in** before it runs.
- Pick or confirm which metrics to feature (or let the skill propose them).
- Provide values it can't pull, plus the product-events list and dates.
- Review the slide **outline** before rendering, and fill manual items (key events,
  non-metric risks).

### Subsequent months

Reuse the saved `deck-config.json` — refresh values, roll the trend series forward
(drop the oldest point, append the new period), and re-render. No re-interview.

## Slide block types

`title · summary · impact · metrics · hero-list · pies · table · trends · feedback ·
issues · definitions` (`bullets` still available for a manual list) — see
`deck-config.schema.md`.

## Guardrails

- Never fabricate or estimate — missing data renders as `N/A`.
- Milestones/key events are **always** filled manually.
- Product-neutral vocabulary everywhere (`growth-taxonomy.md`).
- Confirm the reporting period before rendering.
