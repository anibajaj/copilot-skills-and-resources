---
name: deck-generator
description: >
  Generate a professional, product-neutral monthly telemetry / growth deck for ANY
  product from ANY dashboard or data source. The FIRST time it runs it is fully
  interactive: it introduces itself, asks which dashboards/data sources to pull from,
  helps pick which metrics to show (framed through a universal product-growth lens),
  fetches or collects the data, then renders a config-driven .pptx. Use when someone
  says "create a telemetry deck", "make a growth deck", "monthly metrics slides",
  "build a product review deck", or "turn this dashboard into a presentation".
---

# Deck Generator (generic, any product / any dashboard)

Turn any product's telemetry into a clean executive deck. This skill is **product-
agnostic**: it never assumes a specific product, dashboard, or vocabulary. It maps
whatever metrics exist onto a universal **product-growth lens** (see
`growth-taxonomy.md`) and renders them with a config-driven generator
(`generate-deck.js` → `deck-config.json` → `.pptx`).

## Introduce yourself (say this on first run)

> "I can turn your product metrics into a polished monthly growth deck. I'll ask
> which dashboards or data sources to pull from, help you choose which metrics to
> feature — framed as customer reach, engagement, quality, satisfaction, and
> operational health rather than any product-specific jargon — then build the
> slides. Nothing gets fabricated: anything I can't pull, I'll ask you for."

## Interactive first-run flow

Run these steps **in order**, asking one focused question at a time.

### 1. Basics
Ask: **product/deck name**, **reporting period** (e.g. "May 2026"), and the
**working folder** (where to look for data and save output; default = current dir).

### 2. Discover data sources
Ask **which dashboards / data sources** to pull from. For each, capture a name, a
URL (if any), and how it's accessed. Sources can be anything:
- BI dashboards (Power BI, Looker, Grafana, Tableau, internal portals)
- Analytics tools (Amplitude, GA, Mixpanel)
- Query engines (Kusto/ADX, SQL, SQL Lab)
- Survey/feedback tools
- Files the user has (CSV, Excel, JSON) or screenshots

You do **not** ship connectors. Pull data with whatever is available, in this order:
1. **Files already in the working folder** — read JSON/CSV/Excel/screenshots.
2. **Available MCP/browser tools** — if a browser-automation or API tool is present,
   use it. If a source needs auth, prefer driving the user's already-signed-in
   browser session.
3. **Generate a small reusable fetch script on the fly** for that source (e.g. an
   SSO browser-fetch harness, or a SQL/REST pull) and save it in the working folder
   so next month is one command. Ask the user before running anything that logs in.
4. **Ask the user** to paste values or drop a screenshot for anything not pullable.

### 3. Choose metrics (growth lens)
Walk the seven dimensions in `growth-taxonomy.md`:
**Reach & Adoption · Customer Health · User Engagement · Product Quality ·
Value Realized · Satisfaction & Feedback · Operational & Business Health**.

For each dimension, either:
- Let the user name the metrics they want, **or**
- Inspect the chosen dashboard and **propose** the metrics it exposes as options.

**Translate every metric into product-neutral language before it goes on a slide.**
Say *customers* not "tenants/accounts/orgs"; *users* not "seats/licenses"; *product
quality* not model/pipeline names; *user feedback* not the survey tool's name. A
product rarely has all seven dimensions — include the ones its data supports, drop
the rest. Never invent a dimension to fill space.

### 4. Ask about product events (drives the Impact slide)
**Always ask:** "Were there any notable product events this period or recently —
feature launches, deprecations, major releases, pricing changes — and when did they
happen?" For each event, capture a **name** and a **date**.

If there's a relevant launch, build an **`impact` slide** (placed right after the
executive summary) that shows, for each metric the event moved, the **% change since
the event**, the **original → current** numbers, and a MoM % above its chart. Ask
the user which metrics the event impacted and their value **at the event date** vs
**now**. If there were no events, skip the impact slide.

### 5. Collect the data
Gather each chosen metric's current value and, where a trend matters, the **last 2–3
periods** for the bar charts. Missing values stay `N/A` — do not estimate.

### 6. Build the config and render
1. Assemble a `deck-config.json` (schema in `deck-config.schema.md`) mapping the
   chosen metrics onto slide blocks (`summary`, `impact`, `metrics`, `trends`,
   `pies`, `hero-list`, `table`, `feedback`, `issues`, `definitions`).
2. **Cite a source** on each data slide (`sources: [{name, url}]`, or one top-level
   `sources` for the whole deck) so every figure is traceable — the generator stores
   this provenance and preflight warns on any un-cited slide.
3. **Review the outline first:** run `node generate-deck.js deck-config.json --outline`
   to print the planned slides + key numbers, confirm with the user, then render.
4. Render: `node generate-deck.js deck-config.json "<Product> Telemetry - <Period>.pptx"`.
   A **preflight** pass runs automatically and reports missing/placeholder values,
   month gaps, thin series, un-cited slides, and declining metrics. Add `--strict` to
   abort the build if any hard errors (missing values) are present.
5. Save `deck-config.json` in the working folder so future months start from it.

### 7. Pick a comparison basis (ask once, then reuse)
The **first time** you build a product's deck, ask which period-over-period comparison
the user wants as the default: **MoM** (month-over-month), **QoQ** (quarter, 3 months
back), **YoY** (12 months back), or **baseline** (vs the first period). Set it via
`"comparison": "QoQ"` in the config; it's persisted to the store's `preferences` and
every later `list`/`change` query reuses it automatically (override per call with
`--basis=`). Don't re-ask on subsequent runs.

## Deck-wide conventions (built into the generator)
- **Every time-series chart shows a month-over-month (MoM) % change above it.**
- **Falling metrics are flagged**: any negative MoM (or negative impact) renders a
  red **⚠ "needs attention"** badge automatically. Rising metrics are green. Do not
  hand-wave a decline — surface it.
- **The executive summary auto-lists every declining metric** in a red
  **⚠ Needs attention** banner directly below the headline numbers, so the reader
  is immediately aware of what needs attention. It scans the whole deck (summary
  highlights, metric cards, trend charts), de-dupes, and shows each metric with its
  MoM drop — no config needed.
- **A dedicated `issues` slide** (Top Issues & Underperforming Signals) auto-collects
  every declining metric across the deck, ranks them worst-first with latest value and
  MoM drop, and lets you annotate each with a `notes` map. If nothing is declining it
  renders a green "all signals flat or improving" note. Add manual `items` to append
  non-metric risks.
- **Preflight validation runs on every build** (and blocks with `--strict`): it flags
  missing/placeholder values, month gaps, series too short to trend, slides with no
  cited source, and declining metrics needing explanation. Use `--outline` to review
  the planned slides before rendering.
- The **executive summary** carries up to **8 headline numbers**, each with its %
  change.
- **User feedback** uses the `feedback` block: satisfaction KPIs plus **verbatim
  quotes with hyperlinks** to the source responses (use real quotes/links; leave the
  URL off if none exists).

## Subsequent runs
If a `deck-config.json` already exists, don't re-interview. Copy it to the new
period, refresh values (re-run saved fetch scripts or ask for the deltas), roll the
trend `series` forward (drop the oldest point, append the new period), and re-render.

## Slide block palette (config-driven)
`title · summary · impact · metrics · hero-list · pies · table · trends ·
feedback · issues · definitions` (`bullets` still available for a manual list). See
`deck-config.schema.md` for every field. The generator handles layout, Fluent
styling, MoM badges, ⚠ needs-attention flags, and footers.

## Guardrails
- **Never fabricate or estimate.** Anything not in the data and not provided by the
  user renders as `N/A`.
- **Surface declines** — never hide a falling metric; the ⚠ "needs attention" flag is
  automatic on negative MoM.
- **No product- or vendor-specific terms on slides** — always the growth-lens vocab.
- Confirm the reporting period before rendering.
- Don't run anything that authenticates without asking first.
- **Answer in-deck questions from the store; go to source for anything else.** The
  saved data file is the source of truth for everything in the deck — query it, don't
  guess. If the user asks for something **not** in the store (a metric, segment, or
  period never captured), the default is to **go back to the original source/dashboard
  to fetch it** (re-run the saved fetch script or ask the user), then answer.

## Metrics history & querying (built in)
Every time a deck is built, `generate-deck.js` **saves ALL of the deck's data** to a
per-product store at `data/<product-slug>.metrics.json`. The store is the complete,
self-contained data set behind the deck — **every number that appears on any slide**
(customers, seats, users, rates, single-value cards, even each pie/breakdown slice)
plus the qualitative content. Two goals:
1. **The deck can be regenerated from saved data — no need to re-query the source.**
2. **Anything in the deck is queryable.** If the user asks about a number or quote
   that's in the deck, answer from the store — never guess.

Contents:
- **Numeric metrics** — every value, full month-by-month history keyed `YYYY-MM`,
  upserted each run (old months preserved). Single-value cards are stored as a
  one-point history at the deck period and roll forward next month. Each metric also
  records its **provenance** (`source` name/url) and each value its `pulledAt` date,
  so "where did this number come from?" is answerable.
- **Per-period snapshots** — the qualitative content too: **user feedback** (verbatim
  quotes + satisfaction KPIs), **product events** (launches and their before/after
  impact), and **segment breakdowns** (by plan, region, …) and tables.

Pass `--no-save`, or set `"saveMetrics": false` (or `"metricsStore": "<path>"`) in the
config, to change this.

After a deck exists, **answer any question about it from the store — never guess**.
`query-metrics.js` provides shortcuts:
```
node query-metrics.js <product> list              # every metric, latest value + change
node query-metrics.js <product> change "mau"       # up or down vs the chosen basis? % + values
node query-metrics.js <product> compare "nrr" --basis=QoQ   # override the basis for one call
node query-metrics.js <product> get "nrr"          # full history (with source + pulled dates)
node query-metrics.js <product> up | down          # metrics that rose / fell
node query-metrics.js <product> basis QoQ          # set the default comparison basis
node query-metrics.js <product> feedback           # verbatim quotes + satisfaction KPIs
node query-metrics.js <product> events             # launches and their impact
node query-metrics.js <product> breakdowns         # segment splits (plan, region, …)
```
Comparison basis is **MoM · QoQ · YoY · baseline** — the default is the one saved on
first run (see step 7), overridable per call with `--basis=`.
Metric names match case-insensitively with aliases (mau, dau, nrr, nps, csat…).
**For anything the shortcuts don't cover, read the store JSON directly** — it holds
the complete metric history plus every per-period snapshot, so you can answer
open-ended questions ("what did users complain about?", "how did the launch land?")
from real saved data.

## Output
- `<Product> Telemetry - <Period>.pptx`
- Reusable artifacts: `deck-config.json` (+ any per-source fetch scripts) in the
  working folder; `data/<product>.metrics.json` metrics + snapshot history
  (auto-written).

## Dependencies
Node.js + `pptxgenjs`. If missing, offer: `npm install pptxgenjs`.
(`xlsx` optional, only if reading Excel sources.)
