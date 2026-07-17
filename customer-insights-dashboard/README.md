# Customer Insights Dashboard

**Part 2** of the customer-insights pipeline. Where the
[`customer-insights-extractor`](../customer-insights-extractor/) turns your
meetings, emails, and chats into **categorized** insights, this skill turns those
insights into a **single-page product-overview dashboard** you can open in any
browser and share.

## What it does

1. **Loads** one or more `insights_validated_*.json` files from the extractor.
2. **Clusters** the already-categorized insights into cross-customer **themes**
   — merging by meaning, not keywords.
3. Writes a **5-paragraph executive summary** for the product.
4. **Assembles** a `dashboard_data.json`.
5. **Builds** a self-contained `dashboard.html` — data embedded, no network
   fetch, works offline and via `file://`.

Because the extractor already classifies every insight (blocker / feature
request / positive / negative / general), this skill **skips extraction and
re-classification** and goes straight to clustering.

## The dashboard (product overview)

A single page with:

- **Executive summary** + customer count
- **Top Goals / Use Cases** — what customers are trying to accomplish
- **Top Blockers** — what's preventing adoption
- **Top Feature Requests** — what customers are asking for
- **Top Positive / Negative Feedback** — side by side

Every theme expands to show its description, merged sub-themes, the customers who
raised it, and the verbatim evidence quotes behind it.

## Quick start

```bash
# 1. The agent clusters your extractor output and writes dashboard_data.json
#    (see SKILL.md for the schema).
# 2. Build the dashboard:
node build-dashboard.js dashboard_data.json dashboard.html
```

Try it with the bundled fictional example:

```bash
node build-dashboard.js examples/dashboard_data.example.json examples/sample-dashboard.html
```

Then open the HTML in any browser.

## Files

- `SKILL.md` — the full agent protocol (load → cluster → summarize → build)
- `dashboard-template.html` — the empty, self-contained overview dashboard
- `build-dashboard.js` — validates `dashboard_data.json` and embeds it into the
  template to produce `dashboard.html`
- `examples/dashboard_data.example.json` — a worked example built from the repo's
  fictional HeroForce mock dataset
- `examples/sample-dashboard.html` — the rendered sample dashboard
- `README.md` — this file

## Example prompts

- "Build the insights dashboard from my extractor output."
- "Cluster these insights into themes and make the overview dashboard."
- "Turn `insights_validated_2026-07-15.json` into a product overview."

## Notes

- **One product per dashboard.** If your insights span multiple products, run it
  once per product (or ask for a single combined overview).
- **Evidence is never invented.** Every quote comes from a real extractor
  insight; the build script rejects clusters with missing evidence.
- All names in the examples (product `HeroForce CRM`, customers like
  `Atlas Freight`, `Contoso`) are **fictional placeholders**.
