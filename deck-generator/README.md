# Deck Generator Skill

Generate a professional, **product-neutral** monthly telemetry / growth deck for
**any product** from **any dashboard or data source**.

This is the generalized version of the People Skills telemetry deck: same Fluent
visual system, but nothing is hard-coded to a product. A config file describes the
slides; one generic renderer builds the `.pptx`.

## Files

| File | Role |
|------|------|
| `SKILL.md` | The interactive skill protocol (introduce → discover sources → pick metrics → collect → render). |
| `growth-taxonomy.md` | The universal, product-neutral metric lens (7 growth dimensions) + how the People Skills metrics map onto it. |
| `generate-deck.js` | The config-driven renderer. Reads a `deck-config.json`, writes a `.pptx`. |
| `deck-config.schema.md` | Full schema for `deck-config.json` (all slide block types + fields). |
| `examples/deck-config.example.json` | A complete, product-neutral sample exercising every slide type. |

## Quick start

```bash
npm install pptxgenjs
node generate-deck.js examples/deck-config.example.json "Acme Cloud Telemetry - May 2026.pptx"
```

## How it works

1. **First run is interactive** (see `SKILL.md`): the skill introduces itself, asks
   which dashboards/data sources to pull from, helps you choose which metrics to
   show — framed through a traditional product-growth lens (customer reach,
   engagement, quality, satisfaction, operational health) with **no product- or
   vendor-specific terms** — then looks up the data and builds the deck.
2. **Data pulling is bring-your-own**: it uses files in the folder, any available
   browser/MCP tools, or a small fetch script generated on the fly per source.
   Anything it can't pull, it asks you for. It never fabricates values.
3. **The deck is config-driven**: metrics are assembled into a `deck-config.json`
   of slide blocks (`metrics`, `trends`, `pies`, `hero-list`, `table`, `summary`,
   `bullets`, `definitions`) and rendered by `generate-deck.js`.
4. **Subsequent months** reuse the saved `deck-config.json` — refresh values, roll
   the trend series forward, re-render.

## Slide block types

`title · summary · metrics · hero-list · pies · table · trends · bullets ·
definitions` — see `deck-config.schema.md`.

## Guardrails

- Never fabricate or estimate — missing data renders as `N/A`.
- Milestones/key events are **always** filled manually.
- Product-neutral vocabulary everywhere (`growth-taxonomy.md`).
- Confirm the reporting period before rendering.
