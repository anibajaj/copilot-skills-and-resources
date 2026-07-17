---
name: Customer Insights Dashboard
description: Takes the already-categorized customer insights produced by the Customer Insights Extractor, clusters them into cross-customer themes, writes a per-product executive summary, and builds a self-contained single-page product-overview dashboard (HTML) that works offline.
version: "1.0"
author: anibajaj
triggers:
  - "build the insights dashboard"
  - "build customer insights dashboard"
  - "turn my insights into a dashboard"
  - "cluster my insights into themes"
  - "create the product overview dashboard"
  - "run the insights dashboard skill"
---

# Customer Insights Dashboard

## Purpose

This is **Part 2** of the customer-insights pipeline. Part 1
(`customer-insights-extractor`) scans interactions and produces **already
categorized** insights. This skill takes that output and turns it into a
**product-overview dashboard**:

1. **Loads** one or more Skill-1 output files (`insights_validated_*.json`).
2. **Clusters** the pre-categorized insights into cross-customer **themes**.
3. Writes a **5-paragraph executive summary** for the product.
4. **Assembles** a `dashboard_data.json`.
5. **Builds** a self-contained `dashboard.html` (single product-overview page)
   that works offline and via `file://`.

> Because Skill 1 already classifies every insight (blocker / feature request /
> positive / negative / general feedback), this skill **skips extraction and
> re-classification**. It starts at clustering. It does a light sanity check on
> categories but does not re-derive them.

Works for **any product**. No product-, vendor-, or company-specific vocabulary
is baked in.

---

## Input — what Skill 1 gives you

Each Skill-1 file contains metadata plus an `insights[]` array. Every insight
has (at minimum):

| Field | Meaning |
|---|---|
| `insight_id` | Stable ID |
| `customer` | Customer/company name |
| `category` | `blocker` \| `feature_request` \| `positive_feedback` \| `negative_feedback` \| `general_feedback` |
| `product` | Array of product IDs the insight relates to |
| `theme` | Short original theme (per-insight) |
| `detail` | 1–2 sentence explanation |
| `quote` | Verbatim evidence quote |
| `date` | ISO date of the interaction |
| `source_type` | `meeting` \| `email` \| `teams_chat` \| `call` \| … |
| `source_subject` | Interaction title |

The file may also carry `customer_context` (per-customer narrative) and
`stats`. Use those to enrich the executive summary, but the `insights[]` array
is the source of truth for clustering.

---

## Files in this skill

- `SKILL.md` — this protocol
- `dashboard-template.html` — the empty, self-contained overview dashboard
  (data placeholder = `window.__DASHBOARD_DATA__`)
- `build-dashboard.js` — validates `dashboard_data.json` and embeds it into a
  copy of the template → `dashboard.html`
- `examples/dashboard_data.example.json` — a fictional worked example
- `README.md` — human quick-start

---

## Workflow

### Step 0 — Locate & load the insights

1. Ask the user for the file(s) if not provided: *"Point me at the
   `insights_validated_*.json` file(s) from the extractor — one file or a
   folder."*
2. Load every file. Concatenate all `insights[]` arrays into one working set.
   - **De-dupe** by `insight_id`; if IDs collide across files, keep the most
     recent by `date`.
   - Preserve `customer_context` blocks (merge by customer; newest wins).
3. If insights span **multiple products**, ask which product this dashboard is
   for (one dashboard = one product overview), or offer to build "all products
   combined." Filter `insights[]` to those whose `product` array includes the
   chosen product (or keep all for combined). Ask the user for the
   **display name** and an optional emoji **icon** for the product.

Report: total insights loaded, per-category counts, distinct customers.

### Step 1 — Light category sanity check (NOT full re-classification)

Insights are already categorized. Only fix an item if it is **obviously** in the
wrong bucket (e.g. a hard "we will not deploy without X" ultimatum sitting in
`feature_request` should move to `blocker`). Do **not** re-derive categories
wholesale — trust Skill 1. Note any moves in your report.

**Category → dashboard section mapping:**

| Skill-1 `category` | Dashboard section |
|---|---|
| `blocker` | Top Blockers |
| `feature_request` | Top Feature Requests |
| `positive_feedback` | Top Positive Feedback |
| `negative_feedback` | Top Negative Feedback |
| `general_feedback` | Fold into the executive summary as context; do **not** create a section (keep the overview focused). |

**Goals** are not a Skill-1 category — derive them from `customer_context`
paragraphs and recurring objectives across insights (what customers are trying
to *accomplish*, product-agnostic).

### Step 2 — Semantic clustering (the core step — you, the agent, do this)

Within **each** category, group the individual insights into coherent
cross-customer **themes**. This is judgment work, not keyword matching.

**Rules:**
1. **Merge by meaning, not words.** "one-tap update" + "log deals faster" +
   "reduce clicks to update" are one theme even if the wording differs.
2. **Don't over-merge.** Distinct topics stay separate even if they share a word.
3. **Every insight lands in exactly one cluster** within its category.
   Single-customer topics can be their own one-item cluster.
4. For each cluster produce:
   - `theme` — a **specific, descriptive** name (not "Integration" but
     "Voice and one-tap deal updates to cut mid-day friction").
   - `description` — a 2–3 sentence narrative naming specific customers and what
     they said.
   - `sub_themes` — the original per-insight `theme` strings that were merged.
   - `customers` — distinct customers in the cluster.
   - `items` — every source insight with `customer`, `quote`, `detail`, `date`,
     `source_type`, `source_subject`. **Every item must keep its real `quote`.**
5. Sort clusters within a category by customer count, then item count.

For **goals**, a lighter shape is fine: `theme` + `customers[]` (a bar list, no
evidence needed).

### Step 3 — Executive summary

Write a **5-paragraph** summary for the product, in this order:

1. **Goals** — what customers want to accomplish with the product.
2. **What customers value** — top positive themes, named customers.
3. **Blockers** — what is preventing adoption/expansion, named customers.
4. **Negative feedback** — recurring frustrations, named customers.
5. **Feature requests** — most-requested capabilities, named customers.

Rules: professional, VP-ready prose; ≥100 characters (aim for a real, specific
summary, not a template); reference specific customers; regenerate it every time
the data changes. Weave in relevant `general_feedback` as context.

### Step 4 — Assemble `dashboard_data.json`

Write a file with exactly this shape:

```json
{
  "last_updated": "ISO-8601 timestamp (optional — script fills if omitted)",
  "product": { "name": "Display Name", "icon": "📊" },
  "total_customers": 4,
  "generated_from": ["insights_validated_2026-07-15.json"],
  "executive_summary": "5-paragraph string (use \\n\\n between paragraphs)",
  "themes": {
    "goals":            [ { "theme": "...", "customers": ["A","B"], "customer_count": 2 } ],
    "blockers":         [ <cluster> ],
    "feature_requests": [ <cluster> ],
    "feedback_positive":[ <cluster> ],
    "feedback_negative":[ <cluster> ]
  }
}
```

Where a **`<cluster>`** is:

```json
{
  "theme": "Specific descriptive theme name",
  "description": "2–3 sentence narrative with customer names.",
  "sub_themes": ["original theme 1", "original theme 2"],
  "customers": ["Contoso", "Fabrikam"],
  "customer_count": 2,
  "item_count": 3,
  "items": [
    {
      "customer": "Contoso",
      "quote": "verbatim evidence quote",
      "detail": "1–2 sentence explanation",
      "date": "2026-07-15",
      "source_type": "meeting",
      "source_subject": "Contoso QBR"
    }
  ]
}
```

> **Note the section keys:** the dashboard uses `feedback_positive` /
> `feedback_negative` (mapped from Skill-1's `positive_feedback` /
> `negative_feedback`). The build script validates this. `customer_count` and
> `item_count` are auto-filled if omitted.

See `examples/dashboard_data.example.json` for a complete fictional example.

### Step 5 — Build & validate the dashboard

Run the build script — it **validates** structure first, then embeds:

```bash
node build-dashboard.js path/to/dashboard_data.json path/to/dashboard.html
```

- If validation fails, it prints every issue and writes nothing. Fix
  `dashboard_data.json` and re-run until it passes.
- On success it writes a self-contained `dashboard.html` with the data embedded
  in `<script id="dashboard-data">` — no network fetch, works via `file://` or
  any static/document host.

### Step 6 — Report

Tell the user: product name, customer count, cluster counts per category,
output path and size, and any category corrections you made in Step 1. Offer to
open the dashboard.

---

## Guardrails

1. **Never invent quotes.** Every `items[].quote` must come from a real Skill-1
   insight. If an insight has no quote, omit it rather than fabricate one.
2. **Trust Skill-1 categories.** Only move an item on obvious misclassification.
3. **Clustering must actually cluster** — a "theme" with one vague item that
   could absorb others is a failure. Merge aggressively by meaning, but keep
   genuinely distinct topics apart.
4. **Specific theme names and descriptions.** A reader should understand the
   topic without expanding the card.
5. **Evidence completeness.** Populate `customer`, `quote`, `date`,
   `source_type`, and `source_subject` on every item; missing fields render as
   blanks.
6. **One product per dashboard.** For multiple products, run the skill once per
   product (or build a single combined overview if the user asks).
7. **Always run `build-dashboard.js`** — do not hand-edit the template's
   embedded data. The validator catches the field-name and evidence errors that
   silently break the dashboard.
