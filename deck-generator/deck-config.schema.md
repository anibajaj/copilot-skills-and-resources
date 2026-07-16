# deck-config.json — schema

The generator (`generate-deck.js`) renders whatever this file describes. One
renderer, any product. All fields are optional unless noted.

## Top level

```jsonc
{
  "product": "Acme Cloud",         // required — appears in footer / filename
  "period": "May 2026",            // required — reporting period label
  "confidential": true,            // adds "Confidential" to footer (default true)
  "comparison": "MoM",             // default period comparison: MoM|QoQ|YoY|baseline
  "theme": { ... },                // optional color/font overrides (see below)
  "sources": [                     // default source link shown on slides
    { "name": "Product Analytics", "url": "https://..." }
  ],
  "slides": [ ...blocks... ]       // ordered list of slide blocks
}
```

### theme (all optional, hex without `#`)
`primary`, `accent`, `dark`, `white`, `lightBg`, `medGrey`, `green`, `red`,
`amber`, `purple`, `cardTint`, `font`. Defaults are a Fluent-style palette
with Segoe UI.

## Shared fields on every slide block
- `type` (required) — one of the block types below.
- `label` — small uppercase eyebrow above the title (use a growth dimension name).
- `title` — the slide title.
- `sources` — override the top-level source link for this slide.

## Series (for trend badges + mini charts)
Anywhere a `series` is accepted, pass 2–4 points, oldest first:
```json
"series": [ { "month": "Mar", "value": 3670 }, { "month": "Apr", "value": 3812 }, { "month": "May", "value": 3963 } ]
```
Every chart shows a **month-over-month (MoM) % change** above it (latest point vs the
prior point). If that change is **negative**, the badge turns red and reads
**`⚠ x% MoM · needs attention`** automatically. `value` may be a number or a string
like `"3.9k"`, `"72%"`, `"$0.42"`.

## Block types

### `title`
`title`, `subtitle`, `footnote`. Full-bleed cover slide (not page-numbered).

### `summary`
`body` (paragraph), `highlights` (up to **8** `{value, unit, label, series?|change?}`
cards, 4 per row — each shows its % change), `bullets` (string list).

### `impact`
Impact since a key event (e.g. a feature launch). Place right after `summary`.
- `event: { name, date }` — shown as a caption under the title.
- `metrics`: up to 3 `{ title, original, current, unit?, series?, color? }`. Each card
  shows the **% change since the event** (`(current-original)/original`), the
  **`original → current`** numbers, and a MoM badge above a mini chart. A negative
  change flags **⚠ needs attention**.

### `metrics`
`cards`: up to 8 `{ title, value, unit, series?, sub?, color? }`. Auto-lays out
1–4 columns. With a `series`, a MoM badge + mini bar chart render; otherwise `sub`
shows as a caption. `unit` may be `"%"` or `"$"`.

### `hero-list`
`hero: {value, unit, label, sub}`, optional `secondary: {value, unit, label}`,
and `list: { columns: [...], rows: [[...]] }`. A short first column (≤3 chars, e.g.
`#`) is auto-narrowed.

### `pies`
`charts`: 1–2 `{ title, unit?, breakdown: [{name, value}] }`. Native pie charts.

### `table`
`columns: [...]`, `rows: [[...]]`, optional `note`. Full-width table (≤14 rows).

### `trends`
`charts`: 1–3 `{ title, unit?, series: [...], color? }`. Each shows the latest
value, a MoM badge, and a bar chart.

### `feedback`
User satisfaction slide. `cards`: up to 4 satisfaction KPIs (same shape as `metrics`
cards). `quotes`: up to 3 verbatim quotes `{ text, author, url? }` rendered as quote
cards with a **"View feedback →"** hyperlink (omit `url` to render plain text).

### `bullets`
`items` (string list), optional `note`. A simple manual list (e.g. a milestones
placeholder). Leave `items: []` for a `[ Fill manually ]` placeholder.

### `definitions`
`groups`: 1–2 `{ heading, items: [{term, def}] }`. Appendix / glossary.

### `issues`
Top Issues & Underperforming Signals — an auto watchlist. No data needed: it scans
the whole deck, collects every declining metric (negative MoM), ranks them worst-first
and lists each with its latest value + MoM drop. Optional:
- `notes: { "<metric name>": "why it dropped / what we're doing" }` — annotation per row.
- `items`: manual rows to append `[{ name, meta?, note? }]` (non-metric risks).
- `body`: short intro line.
Renders a green "no declining metrics" note when nothing is falling.

## Preflight & outline (CLI)
- `node generate-deck.js <config> --outline` — print planned slides + key numbers, no render.
- Every render runs a preflight (missing values, month gaps, thin series, un-cited
  slides, declines). Add `--strict` to abort on hard errors.

## Guardrails baked into the workflow
- Missing/`"TBD"`/`null` values render as `N/A` — never fabricate.
- Falling metrics are auto-flagged with **⚠ needs attention** — never hide a decline.
- Use product-neutral vocabulary (see `growth-taxonomy.md`).
