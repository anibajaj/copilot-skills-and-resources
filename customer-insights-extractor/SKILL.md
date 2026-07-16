---
name: Customer Insights Extractor — ALL Products
description: Extracts structured customer insights from today's customer-facing interactions, presents each insight for validation in chat grouped by meeting, and saves the validated output to OneDrive or a location of your choice.
version: "2.2"
author: anirudhbajaj
triggers:
  - "extract customer insights"
  - "run insights extractor"
  - "pull insights from today's calls"
  - "what did customers say today"
  - "customer feedback from today"
  - "run the insights skill"
---

# Customer Insights Extractor — ALL Products

## Purpose

Scan the user's customer-facing interactions from **today** (meetings, emails, Teams chats), extract structured product insights with evidence, present them for validation in chat grouped by meeting, and save the full validated output to a location of the user's choice.

---

## What This Skill Produces

### 1. Customer Context (one per customer)
A **single holistic paragraph** per customer — what they're trying to accomplish, where they are in their journey, what matters to them. This is narrative context, NOT individual line items. Saved to the output JSON alongside insights.

### 2. Interactions Scanned Log
A full record of every interaction reviewed during the run — including those processed AND those skipped (with reason). Saved to the output JSON.

### 3. Validated Insights (individual items)

| Field | Description |
|-------|-------------|
| `insight_id` | Sequential ID: `INS-0001`, `INS-0002`, ... |
| `interaction_id` | Deterministic fingerprint linking this insight to its source |
| `customer` | Company name (inferred from attendee email domains) |
| `primary_domain` | Customer's primary email domain — the stable dedup key |
| `category` | One of: `blocker`, `feature_request`, `positive_feedback`, `negative_feedback`, `general_feedback` |
| `product` | Array of products this feedback targets — e.g. `["crm_core"]` or `["crm_core", "analytics_suite"]`. Never empty, never `agnostic`. Always shown during validation for correction. |
| `theme` | Descriptive label (5+ words, NOT a copy of the quote) |
| `detail` | 2-3 sentence explanation with product context (the "so what") |
| `quote` | Verbatim customer quote or close paraphrase from meeting notes — never AI-generated |
| `quote_source` | `verbatim_transcript`, `meeting_notes`, or `user_reported` — see the transcript-fallback rule below |
| `attribution` | Who the quote is from — `customer` (an external customer said it) or `internal_relayed` (a colleague from your own company relaying specific customer feedback). **Never capture individual names or email addresses — PII is intentionally excluded.** Only the customer company name (`customer` field) is recorded. |
| `date` | Date of the interaction (YYYY-MM-DD) |
| `source_type` | `meeting` / `email` / `teams_chat` |
| `source_subject` | Meeting/email/chat title for traceability |
| `validated` | `true` (accepted) |
| `reviewer_comment` | Optional note or correction added during validation |

---

## SETUP FLOW (First Run Only)

Run this once. On subsequent daily runs, skip straight to the Daily Run Flow.

### SETUP STEP 1 — Product Context

This skill works for any product. Product context makes category classification more accurate — but the skill will always make its best guess even without it.

Ask the user:
> "Which product(s) do you cover? I'll fetch reference material for each one to improve how I classify customer feedback. For each product, share a documentation link, a deck, or a short description of current capabilities and gaps."

For each product provided, fetch and read the content. Extract:
- **Product ID** — short key (e.g. `crm_core`, `analytics_suite`, `mobile_app`)
- **What it already has** — capabilities that exist today
- **What it does NOT have** — genuine gaps

Store all products together in `product_context.json` as a keyed object under `products: { }`. Reuse on every subsequent run without re-asking.

The user can add a new product at any time by saying "add product context for [product name]" — fetch the reference, append to the file, continue.

> **Note:** Product context is optional — the skill will tag and classify insights using best judgment even with no context stored. Context just makes it more accurate.

### SETUP STEP 2 — Review Mode

Ask the user how they want to handle validation on each run:

> "How would you like to review insights each time?
> - **Manual** — I'll walk you through each insight one by one. You accept, reject, or comment on each. Highest quality, takes 5–10 minutes.
> - **Bulk** — I'll show you all insights as a list. You can accept everything in one go or flag specific ones to review. Fast but still quality-controlled. *(Recommended)*
> - **Auto** — I extract and save insights automatically with no review. Fastest, but insights are unvalidated — some false positives may slip through. Output is flagged as `unvalidated`."

Store the chosen mode as `review_mode` in `product_context.json` (`manual`, `bulk`, or `auto`). Apply on every run. The user can change it at any time by saying "change my review mode".

> ⚠️ **Auto mode note:** In auto mode, insights are saved with `"validated": false` and a banner in the output: `"⚠️ Unvalidated — extracted automatically without human review."` This keeps the data honest so downstream consumers know the quality level.

### SETUP STEP 3 — Schedule

Look up the user's working hours (mailbox settings). Suggest a daily run time approximately 1 hour before their typical sign-off:
> "Your working hours end at [time]. I'd suggest running this daily at [time - 1 hour] so you can review insights before wrapping up. Want me to set that up?"

Set up the daily scheduled run with user consent via Cowork.

---

## DAILY RUN FLOW

### STEP 1 — Load Product Context and Determine Date Range

Load `product_context.json`. If not found, run SETUP FLOW first.

Then load `processed_interactions_log.json` to determine what date range to scan:

**Case A — First ever run** (log doesn't exist or is empty):
> "Welcome! Since this is your first run, I'll scan the past 2 weeks to give you a full backfill. This may take a moment."

Scan: today minus 13 days through today (14 days total).

**Case B — Normal daily run** (log exists, `last_run_date` is yesterday):

Scan: today only.

**Case C — Missed day(s)** (log exists, `last_run_date` is 2+ days ago):
> "I noticed the last run was [last_run_date]. I'll catch up on [list of missed dates] as well as today."

Scan: every day from the day after `last_run_date` through today, in chronological order. Process each missed day as a separate batch — separate interaction list, separate output file per day.

**How to detect last_run_date:** Read the `last_run_date` field from `processed_interactions_log.json`. After every successful run, update this field to today's date.

### STEP 2 — Identify Relevant Interactions

Scan **all three sources** in parallel. Do not stop at meetings — emails and Teams chats are equally valid sources of product feedback.

**Identify your own company first:** Call `GetMyDetails` to read the signed-in user's email, and take the domain of that email (e.g. `@yourcompany.com`) as the *internal* domain. Any participant on that domain is internal; any other external domain is a customer.

**Identify customer company:** Use the external participant's email domain as the primary key (e.g., `@contoso.com` → "Contoso"). Build a domain→company lookup and reuse it across all sources.

---

#### Source A — Meetings (Calendar)

Pull today's calendar events. For each with at least one external attendee, attempt to fetch the transcript.

**Exclude:** Fully internal, cancelled, or internal-only subjects (all-hands, standup, sprint, 1:1, focus time, OOF, blocked, lunch, personal, take a break).

**Content quality gate:** Skip `thin` (< 200 chars), `meta_content` (tool artifact phrases), `duplicate_template` (byte-identical to 3+ series meetings — keep most recent).

**Transcript unavailable — notes fallback, then ask the user:**
A transcript may be inaccessible for several reasons — the meeting was organised on an **external tenant** (different Tenant ID in the join URL → 403), transcription was never turned on, or the transcript simply hasn't been generated. In **every** one of these cases, do NOT silently drop the meeting:

1. **Look for notes.** Search for notes or a recap tied to this meeting in BOTH places:
   - the **Teams meeting chat** (notes/recap posted during or after the meeting), and
   - any **email thread** matching the meeting (subject match, organizer/attendee overlap, same date) that contains shared notes, minutes, or a recap.
2. **If notes are found**, use them as the source and set `quote_source: "meeting_notes"` on all insights from that interaction.
3. **If NO notes are found in chat or email, prompt the user** — surface the meeting so they can recognise it and share notes manually:
   > "I couldn't find a transcript or any notes for this meeting:
   > • **Customer:** [Customer]
   > • **Meeting:** [Subject]
   > • **Date / Time:** [Date, Time]
   >
   > If you have any notes from this call, paste them here and I'll pull insights from them — or let me know to skip it if there's nothing to share."
   - If the user **pastes notes** → extract insights from them and set `quote_source: "user_reported"`.
   - If the user **skips** → record the interaction as `skipped_no_content` in the log.
4. When the source is `meeting_notes` or `user_reported`, warn the user during validation that quotes are from notes, not a verbatim transcript (see Step 5e).

---

#### Source B — Emails

Search today's inbox for emails from or to an external domain that are substantive (not auto-notifications, calendar invites, DevOps/GitHub alerts, digest emails, or encrypted messages with inaccessible bodies).

Look for: direct customer reply threads, forwarded customer feedback, customer follow-ups referencing product discussions. Read the full thread. Set `source_type: "email"`.

**Exclude:** Azure DevOps / GitHub notifications, calendar invite emails, internal digests, newsletters, vendor-only external addresses.

---

#### Source C — Teams Chats

Search today's Teams chats for conversations with external participants containing product-relevant feedback. Use `SearchM365` with `sources: ["teams"]` and product keywords scoped to today. Also check known ongoing customer chat threads directly.

Look for: 1:1 or group chats with external participants, shared/cross-company channel messages, post-meeting follow-up messages. Set `source_type: "teams_chat"`.

**Exclude:** Fully internal chats, logistics-only messages, system events.

---

**Track ALL interactions** across all three sources — processed and skipped — for the interactions log saved in output.

**Present to user before proceeding:**
```
📋 Found {N} customer interactions today across {M} customers:

| # | Customer | Source | Subject | Time |
|---|----------|--------|---------|------|
| 1 | {company} | meeting | {subject} | {time} |

Skipped: {n} internal-only, {n} cancelled, {n} personal blocks, {n} no content
Does this look right? Any interactions missing?
```

Then ask:
> "Does this look right? Are there any customer meetings or calls from today that aren't in this list — for example, calls that weren't on your calendar, or meetings hosted on a customer's system?"

If the user names additional interactions, look them up (Teams chats, emails, or ask for the meeting link) and add them to the scan list before proceeding.

### STEP 3 — Extract Insights (Stage 1 — Broad Capture)

For each interaction, read the **full content** and extract every item the customer discussed that could be relevant to the product team. Cast a wide net — the user filters in Step 5.

Include: things they want to do but can't, problems or errors they encountered, features they mentioned wanting, frustrations or workarounds, references to other systems.

Do NOT skip items that seem minor.

### STEP 4 — Classify & Enrich (Stage 2 — Filter & Classify)

Using the loaded product context, filter and classify raw extractions into real product insights.

**FILTER OUT:**
- Deployment steps the customer needs to take
- Informational questions where the customer is just learning (not requesting a change)
- Scheduling/logistics
- Purely operational action items
- Internal actions by your own team
- Things the product already does — UNLESS the customer couldn't find or use the feature (that's `negative_feedback` about discoverability)

**KEEP and classify as:**

#### BLOCKER
Customer used strong, dealbreaker language. They will not proceed unless this is resolved.

Required signal: `will not`, `cannot`, `won't`, `non-starter`, `blocked`, `must have`, `deal breaker`, `showstopper`, `until...resolved`, `prerequisite for deployment`.

**Be conservative.** If the language is a strong preference but not an ultimatum → `feature_request`. When in doubt, downgrade.

| ✅ Valid Blocker | ❌ Reclassify as... |
|-----------------|---------------------|
| "We cannot roll this out until privacy is confirmed" | "Privacy is a concern" → `negative_feedback` |
| "Without SSO integration, this is a non-starter" | "It would be great to have SSO integration" → `feature_request` |
| "This is a prerequisite for deployment" | "This creates a constraint for us" → `feature_request` |

#### FEATURE REQUEST
Customer explicitly asked for a capability that doesn't exist yet. Not a dealbreaker — they'll continue without it short-term.

#### POSITIVE FEEDBACK
Customer expressed genuine satisfaction about a **specific product capability** they experienced.

#### NEGATIVE FEEDBACK
Customer expressed dissatisfaction about a **specific product issue**. Not strong enough to be a blocker.

#### GENERAL FEEDBACK
Customer commentary that is valuable to the product team but **not tied to a specific product capability** — their view on AI and how it's reshaping work, their strategy or vision, broad pain points, industry/market observations, or how they think about adoption and change. These don't map to a blocker/request/positive/negative on a specific feature, but they're worth capturing so the team can query them later.

Examples:
- *"Our whole go-to-market is moving toward automation, and AI has to be defensible for our leadership to trust it."*
- *"The hardest part for us is unifying customer data across five different systems."*
- *"AI is changing how our managers even think about team structure."*

Tag `product` as `["general"]` when the comment isn't about a specific product. Still requires a verbatim quote and follows the same PII rule (no individual names).

> **NOTE — goals vs. general feedback:** A customer's concrete business *objectives* (what they're trying to achieve) still belong in the **customer context paragraph**, not as insights. But broader *commentary* — their vision for AI, how AI is changing their work, strategic direction, and cross-cutting pain points — should be captured as `general_feedback` insights so the team can query them. When in doubt: if it's a durable point of view or pain point the team would want to see, capture it as `general_feedback`.

**What is NOT an Insight (Skip Entirely):**
- Said by someone from your own company (not relaying customer words)
- Generic pleasantry ("Excited to partner", "Great session")
- Vague or non-specific (< 30 chars of substance)
- Your own rep describing or demoing the product
- Scheduling/logistics
- Internal action items
- Deployment logistics without feedback

**The Internal-Relay Exception:** If a colleague from your own company relays specific customer product feedback, that IS valid. Detection pattern: "customer said/wants/needs", "they said/need/asked for", "client said/wants".

**For each kept insight, write:**
- **INSIGHT_ID:** INS-XXXX (sequential across all meetings in the run)
- **CATEGORY:** blocker / feature_request / positive_feedback / negative_feedback / general_feedback
- **PRODUCT:** Tag using best judgment from conversation content — the context file improves accuracy but is never required. Use this logic:
  - **Product identified + in context file** → use context to validate category accurately
  - **Product identified but NOT in context file** → tag it anyway (e.g., `analytics_suite`), note inline: "I think this is for [product] but it's not in my context — consider adding it." Do NOT block extraction.
  - **Product unclear** → assume the user's primary product (first entry in `product_context.json`). Never leave untagged.
  - **Spans multiple products** → tag all of them: `["crm_core", "analytics_suite"]`. Note in detail which aspect applies to which product.
  - **`agnostic` is not valid** — always make a call. Never leave the array empty. For `general_feedback` that isn't about a specific product, use `["general"]`.
- **THEME:** 5+ word descriptive summary — specific enough to cluster similar insights across customers, abstract enough to not just repeat the quote
- **DETAIL:** 2-3 sentences — what did they say, what's the context, what gap does it reveal. Refer to people by role or attribution, never by name.
- **QUOTE:** Verbatim from the transcript or close paraphrase from meeting notes. If the quote contains an individual's name, replace it with their role or a neutral placeholder (e.g., "[a colleague]") to keep it PII-safe.
- **QUOTE_SOURCE:** `verbatim_transcript`, `meeting_notes`, or `user_reported`
- **ATTRIBUTION:** `customer` or `internal_relayed` — do NOT record the individual's name or email. PII is intentionally excluded; the customer company name is captured separately.

**Blocker check:** Before finalising any `blocker`, confirm ultimatum language is present. If absent → downgrade to `feature_request`.

**Deduplication:**
- Within this run: same customer + same category + overlapping theme + similar quote → merge
- Across prior runs: load `processed_interactions_log.json`, skip any `interaction_id` already processed

### STEP 5 — Validate (behaviour depends on review_mode)

**Before showing any insights, explain the four categories once** — adapted to the products in the user's context file. Show one concrete example per category drawn from those products' known gaps and capabilities:

```
Before we go through the insights, here's a quick guide to what each category means:

🔴 BLOCKER — Customer said they cannot or will not proceed until this is fixed.
   Example: "We can't go live until imported records auto-dedupe — we won't ask reps to clean the same data twice."

🔵 FEATURE REQUEST — Customer asked for something the product doesn't do yet, but it's not a dealbreaker.
   Example: "Can you add custom fields so we can segment our pipeline the way we want?"

🟠 NEGATIVE FEEDBACK — Something frustrates them or doesn't work well, but hasn't threatened to stop using the product.
   Example: "The edit vs. quick-view UX is confusing — the caret is easy to miss."

🟢 POSITIVE FEEDBACK — Something they genuinely love about the product.
   Example: "The lead-scoring accuracy is impressive — our managers are actually using it."

🟣 GENERAL FEEDBACK — A broader view or pain point not tied to one feature: their take on AI, their strategy, or how work is changing.
   Example: "Our whole sales model is going automation-first — AI has to be defensible for leadership to trust it."

Ready? Here's what I found.
```

Show this **once per run only**, not once per meeting. Adapt examples to the actual products — never use generic placeholders.

Load `review_mode` from `product_context.json`.

**If `auto`:** Skip all validation. Mark every insight `"validated": false`. Add banner to output: `"⚠️ Unvalidated — extracted automatically without human review."` Proceed directly to Step 6.

**If `bulk`:** Show all insights for all meetings as a single text list (ID, category, product, theme, quote). Then show one card: "Accept all, or flag specific IDs to review?" If they flag any, step through only those individually using the manual flow below.

**If `manual`:** Follow the full per-meeting flow below.

### STEP 5a — Full Validation Flow (manual and flagged-bulk items)

For each meeting, follow this sequence exactly:

**5a. Show meeting header + customer context**
```
🏢 [CUSTOMER] — [Meeting title]
[Date] | [Time]

[Customer context paragraph — 2-3 sentences on their goals, journey, what matters to them]
```

**5b. List ALL insights for this meeting as markdown text.** Every field must be visible before any card appears:
```
INS-0001 | 🔴 BLOCKER | product: crm_core
Theme: [theme]
Detail: [detail]
Quote: "[verbatim quote]"  ← or [meeting notes] prefix if quote_source = meeting_notes
Attribution: customer   ← or internal_relayed; never an individual's name
```

> ⚠️ CRITICAL UI NOTE: The `AskUserQuestion` card only renders the header chip and option buttons — the `question` body text is NOT visible to the user. Never put insight details inside the card's question text. Always display insights as markdown text BEFORE showing any card.

**5c. Ask upfront how they want to review:**

Show a card:
- **Accept all** — all insights from this meeting accepted, move to next meeting
- **Review one by one** *(recommended)* — step through each insight individually

**5d. If "Review one by one":** For each insight, show its full text again (as a reminder), then immediately show a minimal card:
- **Accept** — keep as-is
- **Reject** — remove from output
- **Accept with comments** — keep; user types a note, correction, or reclassification in the reply box

**5e. If source is meeting_notes:** Before validation begins for that meeting, warn:
> "Quotes for [Customer] are from structured meeting notes, not a verbatim transcript. Do you want to keep these insights with the source flagged, or reject all?"

**5f. Product tag corrections:** If the user flags a wrong product tag via "Accept with comments", update it before saving.

**5g. After all insights for a meeting are decided, ask:**
> "Is there anything else from this call that would be useful feedback for the product team — something that wasn't captured above?"

If the user shares additional feedback, treat it as a new insight: ask for the quote and proposed category (do NOT ask for or record any individual's name — PII excluded; set `attribution` to `customer` or `internal_relayed`), then add it with `insight_id` continuing the sequence. Set `quote_source: "user_reported"` to flag that this was manually added rather than extracted from the transcript.

### STEP 6 — Save Output

Once all meetings are processed, ask:
> "Where would you like to share the output with your team? I'll always save a copy to your personal OneDrive for run tracking — just let me know if you also want it in a shared Teams/SharePoint folder."

**Always save to personal OneDrive (required — do not skip):**
`Documents/Cowork/skills/customer-insights-extractor/runs/customer-insights-{YYYY-MM-DD}/`

This is where `processed_interactions_log.json` lives and is updated after every run. Without this, the skill loses track of what was already processed and the missed-day detection breaks.

**If the user specifies a shared location** (SharePoint, Teams folder, etc.):
Write the same output files there too. This is the team-facing copy.

Create a dated folder (`customer-insights-{YYYY-MM-DD}`) at the chosen location. Write **two files**:

---

**FILE 1 — `insights_validated_{YYYY-MM-DD}.json`**

This is the **single output file** containing everything: who ran it, the customer context (goals), all interactions scanned, and the validated insights. Nothing is split across separate files.

```json
{
  "generated_at": "ISO timestamp",
  "validated_at": "ISO timestamp",
  "date_of_interactions": "YYYY-MM-DD",
  "processed_by": "user@yourcompany.com",
  "processed_by_name": "Full Name",
  "product_scope": "[product name from context]",
  "stats": {
    "total_extracted": 0,
    "accepted": 0,
    "rejected": 0,
    "duplicates_skipped": 0,
    "by_category": { "blocker": 0, "feature_request": 0, "positive_feedback": 0, "negative_feedback": 0, "general_feedback": 0 },
    "by_product": { "crm_core": 0, "analytics_suite": 0, "mobile_app": 0 },
    "by_customer": { "Contoso": 0, "Fabrikam": 0 }
  },
  "customer_context": {
    "[Customer A]": "[holistic paragraph describing their goals, journey, and what matters to them]",
    "[Customer B]": "[holistic paragraph]"
  },
  "interactions_scanned": {
    "total": 0,
    "customer_facing_processed": 0,
    "skipped_internal": 0,
    "skipped_cancelled": 0,
    "skipped_personal": 0,
    "skipped_thin_content": 0,
    "skipped_no_content": 0,
    "detail": [
      { "subject": "...", "customer": "...", "source": "meeting", "status": "processed", "time": "07:00 PT" },
      { "subject": "...", "source": "email", "status": "skipped_internal" },
      { "subject": "...", "source": "teams_chat", "status": "skipped_auto_notification" }
    ]
  },
  "insights": [
    {
      "insight_id": "INS-0001",
      "interaction_id": "meeting::contoso.com::2026-06-15::product-roadmap-integration",
      "customer": "Contoso",
      "primary_domain": "contoso.com",
      "category": "blocker",
      "product": ["crm_core"],
      "theme": "...",
      "detail": "...",
      "quote": "...",
      "quote_source": "verbatim_transcript",
      "attribution": "customer",
      "date": "2026-06-15",
      "source_type": "meeting",
      "source_subject": "Product Roadmap & Integration Discussion",
      "validated": true,
      "reviewer_comment": null
    }
  ]
}
```

To populate `processed_by` and `processed_by_name`: call `GetMyDetails` at the start of each run to get the signed-in user's email and display name.

---

**FILE 2 — `processed_interactions_log.json`** *(separate — dedup + run tracking)*

This file serves two purposes:
1. **Dedup** — tells tomorrow's run which interactions were already processed so they aren't re-extracted
2. **Run tracking** — `last_run_date` tells the skill whether this is the first run, a normal run, or a catch-up after missed days

> ⚠️ **CRITICAL — persistent storage required:** Each scheduled run starts a fresh session with no memory of previous runs. The log MUST be stored in OneDrive or SharePoint — NOT in the local workspace — so every new session can find it. The local workspace does not persist between scheduled runs.

**Log file location (fixed path):**
Always read and write the log from the same OneDrive path:
`Documents/Cowork/skills/customer-insights-extractor/processed_interactions_log.json`

On every run:
1. **Start of run** — fetch the log from this OneDrive path using `SearchDrive` or `GetDriveItem`. If not found → first run.
2. **End of run** — upload the updated log back to this same OneDrive path (overwrite).

This ensures scheduled runs always know when the last run happened, even across separate sessions.

```json
{
  "last_updated": "ISO timestamp",
  "last_run_date": "YYYY-MM-DD",
  "first_run_completed": true,
  "processed_interactions": [
    {
      "interaction_id": "meeting::contoso.com::2026-06-15::product-roadmap-integration",
      "customer": "Contoso",
      "source_type": "meeting",
      "date": "2026-06-15",
      "insights_extracted": 8,
      "quote_source": "verbatim_transcript"
    }
  ]
}
```

**Fields:**
- `last_run_date` — date of the most recent successful run (YYYY-MM-DD). Used to detect missed days and first run.
- `first_run_completed` — set to `true` after the 14-day backfill is done. On subsequent runs, only scan today (or missed days).
- `processed_interactions` — array of all interaction IDs ever processed, used for dedup.

---

**FILE 3 — `insights_validated_{YYYY-MM-DD}.csv`** *(optional flat mirror)*

Flat CSV of the insights array only (no nested objects). Useful for sharing or pasting into a spreadsheet. Include: `insight_id`, `customer`, `category`, `product`, `theme`, `quote`, `quote_source`, `attribution`, `date`, `source_subject`, `reviewer_comment`. Do NOT include any individual person's name or email in the CSV.

---

## Tracking & Deduplication

### Interaction ID Formula

```
normalize(text) = lowercase → strip "RE:", "FW:", "Fwd:" prefixes → trim
  → replace non-alphanumeric with hyphens → collapse multiple hyphens → truncate to 60 chars
```

| Type | Formula |
|------|---------|
| Meeting | `meeting::{primary_domain}::{date}::{normalize(subject)}` |
| Email | `email::{primary_domain}::{date}::{normalize(subject)}` |
| Teams chat | `chat::{primary_domain}::{normalize(thread_name)}` |

Two different users processing the same meeting produce the same ID.

### Quote-Hash Dedup

```
quote_hash = SHA-256(lowercase(trim(quote)))
```

Same `customer` + same `category` + same `quote_hash` = duplicate. Skip.

---

## Quality Rules

1. **Every insight needs a real quote** — verbatim from transcript, or close paraphrase from meeting notes. Never AI-generated. If no quote exists, the insight isn't extractable.
2. **Always set `quote_source`** — `verbatim_transcript` or `meeting_notes`. Never leave blank.
3. **Only external customer statements qualify** — internal colleagues only count if relaying specific customer words.
4. **Theme ≠ quote** — the theme must add understanding, not just shorten the quote.
5. **Detail must explain "so what"** — what product gap does this reveal? Why does it matter?
6. **No duplicate insights** within same customer + category — merge if overlapping.
7. **Blockers require ultimatum language** — if missing, downgrade to `feature_request`. Be conservative.
8. **Product tags must be shown during validation** — so the user can catch and correct mis-tags.
9. **Every content-bearing interaction should yield insights** — if a meeting clearly has customer feedback but 0 insights extracted, re-read it.
10. **Save `customer_context` and `interactions_scanned` to the output JSON** — not just the insights array.
11. **No PII — never record individual names or email addresses.** Capture only the customer company name (`customer`) and what was said. Use `attribution` (`customer` / `internal_relayed`) in place of any personal name, and redact names that appear inside `theme`, `detail`, or `quote` to a role or neutral placeholder.
12. **Capture `general_feedback` too** — non-product commentary (AI vision, strategy, cross-cutting pain points, how AI is changing work) is a valid insight category, tagged `product: ["general"]`, so the team can query it. Concrete business objectives still live in the customer context paragraph, not as insights.

---

## Completion Summary

After saving, update `processed_interactions_log.json`:
- Set `last_run_date` to today's date
- Set `first_run_completed: true` (if this was the first run)
- Append all newly processed interaction IDs to `processed_interactions`

Then show:

```
✅ Insights extraction complete.

📅 DATE RANGE
  [First run: Past 14 days (YYYY-MM-DD → YYYY-MM-DD)]
  [Normal: Today (YYYY-MM-DD)]
  [Catch-up: YYYY-MM-DD + YYYY-MM-DD + today]

📊 RESULTS
  Interactions scanned: {N} (customer-facing: {n}, skipped: {n})
  Insights extracted: {N}
  Accepted: {N} | Rejected: {N}
  Duplicates skipped (prior runs): {N}

  By category: blocker: {n} | feature_request: {n} | positive: {n} | negative: {n} | general: {n}
  By product:  crm_core: {n} | analytics_suite: {n} | mobile_app: {n} | general: {n}
  By customer: [Customer A]: {n} | [Customer B]: {n}

📁 Saved to: {output_path}/customer-insights-{date}/
   insights_validated_{date}.json        ← one per day processed
   insights_validated_{date}.csv
   processed_interactions_log.json       ← updated, last_run_date = today
```
