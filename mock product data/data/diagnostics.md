# Diagnostics — Why the Step 2 → Step 3 drop? (June 2026)

> **DEMO evidence.** Supporting analysis for the daily-activation drop, where **74,100
> reps viewed their deals but only 47,300 updated anything (a 36% fall)**. These are the
> cheap diagnostics run to separate the real cause from look-alikes. Read alongside
> `user-feedback.json` and the `user research data/` files. Figures are illustrative but internally
> consistent with the telemetry deck.

## The signal, restated
- **Step 2 (viewed their deals):** 74,100 / 80,510 = **92%.** Reps reach and see their work.
- **Step 3 (took a meaningful action / updated):** 47,300 / 80,510 = **59%.**
- The gap is **view → do**, not login → find. Whatever the cause, it lives *after* the rep
  is already looking at their deals.

---

## Candidate hypotheses and what the data says

### A. Home / navigation problem — reps can't find their work → **RULED OUT**
- Step 2 is **92%** — reps overwhelmingly reach and view their deals. If findability were
  the issue, Step 2 would be low. It isn't.
- Critical feedback contains **~0** "can't find my deals / confusing navigation" mentions
  (see `user-feedback.json` → `themeCounts.critical`). Multiple reps volunteer the opposite:
  *"Nothing wrong with finding my deals — they're right there when I log in."*
- **Conclusion:** the problem is not getting reps *to* their deals.

### B. Mix shift — the daily cohort got diluted by new users / managers → **RULED OUT**
- **By tenure:** the view→do gap is essentially flat across cohorts — established reps
  (12+ mo tenure) update at **61%** after viewing; new reps (<3 mo) at **57%**. A mix shift
  would show the drop concentrated in new users. It isn't concentrated.
- **By role:** filtering to **individual-contributor reps only** (excluding managers/RevOps
  who legitimately never update a deal) the gap *barely moves* — 60% update-after-view vs
  59% overall. So "managers just looking at dashboards" does not explain it.
- **Conclusion:** not an artifact of who's logging in.

### C. Empty pipeline / no leads — nothing to work on → **RULED OUT**
- Segmenting to accounts with **healthy fresh lead flow** (new opportunities assigned in
  the last 7 days), the view→do gap is the **same** (58% update-after-view). Reps *have*
  deals to act on — deals they open and look at — and still don't update them.
- Reps in feedback describe active pipelines they're selling into, not empty ones.
- **Conclusion:** supply of work is not the constraint.

### D. Reps work away from the desk / on calls and don't update the CRM → **BEST SUPPORTED**
- **Largest critical theme:** 268 mentions of "updating is too much work while selling /
  on calls," plus 141 asking for voice/one-tap logging and 96 saying "I only update at
  end of week/day." This is the dominant, specific complaint.
- **Device split:** of the reps who *viewed but didn't update*, **71% of those sessions
  were on mobile**; of the reps who *did* update, only **34%** were on mobile. Updating
  happens at a desk; viewing happens on the move.
- **Timing:** updates cluster **after 6pm and on Sundays** (batched "catch-up"), while
  views are spread across 9am–5pm. Classic "look during the day, log later (or never)."
- **Call correlation:** reps in the **top quartile of daily call/meeting volume** have the
  **lowest** update-after-view rate (**48%**) vs the bottom quartile (**77%**). The more
  they're selling, the less they log.
- **Conclusion:** reps see their work between calls but the *write* is too costly to do
  live, so it slips — this is the mechanism behind the Step 2→3 fall.

### E. Measurement artifact — "meaningful action" undercounts real work → **RULED OUT**
- "Meaningful action" already counts **any** write: logging a call/email/note, editing a
  field, advancing a stage, updating an account. It is deliberately broad.
- A **manual audit of 300 "viewed-but-no-update" sessions** confirmed **94%** were
  genuinely read-only (no write attempted), not mis-logged.
- Excluding sub-30-second and notification-bounce sessions leaves the gap essentially
  unchanged (60% vs 59%).
- **Conclusion:** the drop is real, not an instrumentation quirk.

---

## Bottom line
Reps **can** find and **do** look at their pipeline (Step 2 = 92%). What they don't do is
**update it while they're selling** — because they're on calls or in the field and logging
is too heavy to do live. Every competing explanation (navigation, mix, supply, timing of
the AI Assist launch, measurement) fails a specific test above; the **work-away-from-desk /
don't-update** explanation is the one all three evidence sources converge on.

**So the fix is not a prettier Home** (they already see the work) — it's **making the
update effortless where reps already are**: fast mobile capture, one-tap "log this call,"
or **AI Assist drafting the update from the call so the rep just confirms.**
