# Customer Insights Extractor

A Cowork skill that scans your day's customer-facing interactions — meetings,
emails, and chats — and turns them into structured, validated product insights
with an evidence quote behind every item. It works for **any product**: you tell
it once which products you cover, and it classifies feedback accordingly.

## What it does

1. Scans **today's** interactions across three sources in parallel: calendar
   meetings (with transcripts), emails, and Teams chats.
2. Identifies each customer by the external participant's email domain, and your
   own company by the signed-in user's domain (so it knows internal vs. external).
3. Extracts every item a customer discussed, then classifies each into
   **blocker**, **feature request**, **positive**, **negative**, or **general**
   feedback — tagged to the relevant product.
4. Writes a short **customer context** paragraph per customer (their goals and
   where they are in their journey).
5. Presents everything for validation grouped by meeting — manual (one-by-one),
   bulk (accept-all with flagging), or auto (no review, flagged unvalidated).
6. Saves a structured JSON (plus optional CSV) to a location you choose, and keeps
   a run log so it never re-processes the same interaction twice.

## How review works

On first run the skill asks how you want to validate insights each time:

- **Manual** — walk through each insight individually; accept, reject, or comment.
- **Bulk** *(recommended)* — see all insights as a list; accept all or flag
  specific ones to review.
- **Auto** — extract and save with no review; output is flagged `unvalidated`.

You can change the mode at any time. Product context and review mode are stored
once and reused on every subsequent run.

## Evidence & privacy rules

- **Every insight needs a real quote** — verbatim from a transcript or a close
  paraphrase from meeting notes. Quotes are never AI-generated.
- **No PII.** Individual names and email addresses are intentionally excluded.
  Only the customer *company* name is recorded; any name inside a quote is
  redacted to a role or neutral placeholder.
- **Blockers require ultimatum language** — otherwise they're downgraded to a
  feature request. The skill is deliberately conservative.

## Outputs

- `insights_validated_{date}.json` — customer context, interactions scanned, and
  all validated insights in one file.
- `insights_validated_{date}.csv` — optional flat mirror for spreadsheets.
- `processed_interactions_log.json` — dedup + run tracking (must persist in cloud
  storage so scheduled runs remember prior state).

## Example prompts

- "Extract customer insights."
- "Pull insights from today's calls."
- "What did customers say today?"
- "Run the insights extractor."

## Files

- `SKILL.md` — the full skill workflow, classification rules, and guardrails
- `README.md` — this overview

> **Note:** Examples in this skill (product IDs like `crm_core`, customer names
> like `Contoso`) are fictional placeholders. Configure your own products on first
> run.
