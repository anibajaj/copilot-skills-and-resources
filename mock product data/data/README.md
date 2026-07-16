# Evidence Pack — Daily-Activation Drop (June 2026)

> **DEMO evidence.** A small, self-contained pack assembled to investigate one question:
> in the daily-activation funnel, **why do reps who *view* their deals (Step 2, 92%) fail
> to *update* them (Step 3, 59%) — a 36% drop?** The materials here are raw-ish signals.
> They are meant to be read and reasoned over independently; no single file states the
> answer on its own.

## The question
From the source dashboard's daily activation funnel:

| Step | | Users | % of logins |
|---|---|---|---|
| 1 | Login | 80,510 | 100% |
| 2 | Viewed their deals | 74,100 | 92% |
| 3 | **Took a meaningful action (updated)** | 47,300 | **59%** |
| 4 | Returned the next day | 41,900 | 52% |

The biggest fall is **Step 2 → Step 3**. Reps clearly reach and see their work; far fewer
update it. Why?

## Candidate explanations (all on the table)
- **A —** Home/navigation: reps can't find their work.
- **B —** Mix shift: the daily cohort is diluted by new users or managers who never update.
- **C —** Supply: reps have empty pipelines / nothing to act on.
- **D —** Reps work away from the desk / on calls all day and don't update the CRM.
- **E —** Measurement artifact: "meaningful action" undercounts real work.

## What's in this pack
| File | What it contains |
|------|------------------|
| `heroforce-metrics.json` | **All deck metrics as monthly series** + month-over-month change + an explicit **`watchlist`** of declining signals (DAU, NRR) + the **`dailyActivationFunnel`**. An external skill can read this alone and detect the drop-offs. |
| `user-feedback.json` | June NPS + verbatims (KPIs coherent with the deck). Positive *and* critical themes. |
| `diagnostics.md` | Cheap segment analyses that test each hypothesis A–E. |
| `user research data/01-marcus-bell-field-ae.md` | Field AE, on the road, phone-only, updates "Friday if I remember." |
| `user research data/02-priya-nair-inside-sales.md` | High-volume phone rep, glances between dials, no time to log. |
| `user research data/03-diego-alvarez-territory-rep.md` | Territory rep, mobile-from-the-car, asks for voice logging. |
| `user research data/04-sarah-whitmore-enterprise-ae.md` | Enterprise AE, in meetings all day, batches updates Sunday night. |
| `user research data/05-tom-becker-smb-ae.md` | SMB AE, "seller not an admin," wants one-tap AI-drafted updates. |

## How to use it
Start with `heroforce-metrics.json` — the `watchlist` shows **Daily active users** and
**Net revenue retention** are declining, and `dailyActivationFunnel` shows the biggest fall
is **Step 2 → Step 3** (viewed their deals → took a meaningful action). Then read the
feedback and personas, weigh them against the diagnostics, and decide which of A–E best fits
**all** the evidence at once. A sound conclusion should explain not just the critical
feedback but also why the *other* hypotheses fail their tests in `diagnostics.md`.
