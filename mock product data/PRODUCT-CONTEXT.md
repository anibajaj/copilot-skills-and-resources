# HeroForce — Product Context

> A single briefing that lets any agent (or new teammate) understand what HeroForce
> is, who it's for, how people use it day to day, and how every number in the
> **June 2026 Telemetry deck** maps back to the product. Everything here is
> intentionally consistent with that deck — same customers, seats, users, AI Assist
> launch, top accounts, and the daily-use funnel.

---

## 1. What HeroForce is

**HeroForce is a B2B SaaS CRM** (customer relationship management platform) for sales
teams. Companies buy it by the **seat** (one seat = one licensed rep/user) and use it
to manage their sales **pipeline** — the set of open deals moving from first contact to
close. It is a cloud product: reps sign in through a browser or desktop app, and every
deal, contact, activity, and forecast lives in one shared workspace.

The product's promise: **help reps find the right deal to work on, log what they did,
and close faster** — increasingly with the help of an AI copilot (**AI Assist**,
launched May 15, 2026).

**Category:** Sales CRM / Revenue platform
**Model:** Multi-tenant SaaS, per-seat subscription, three plan tiers
**Primary job-to-be-done:** *"Show me what to work on next and help me close it."*

---

## 2. Who it's for

### Buyers & plans
Customers are **companies** (8,420 total in June 2026; 5,180 of them paying). They land
on one of three plans:

| Plan | Who it's for | Customers (Jun 2026) |
|------|--------------|----------------------|
| **Starter** | Small teams, first CRM, a handful of reps | 3,240 |
| **Growth** | Scaling sales orgs, multiple teams, integrations | 3,110 |
| **Enterprise** | Large orgs, advanced security, high seat counts | 2,070 |

### Regions
Sold globally, weighted to the Americas:
**Americas 3,960 · EMEA 2,870 · APAC 1,210 · LATAM 380** customers.

### End users (the people in the app daily)
- **Sales reps / Account Executives** — the core daily user. Work their pipeline, open
  deals, log calls/emails/meetings, update deal stages.
- **RevOps / Sales Operations** — configure pipelines, dashboards, integrations; watch
  team health and forecast accuracy.
- **Sales managers / VPs** — review team pipeline, coach, read reports and forecasts.

**Scale:** 268,400 paid seats sold; 214,600 monthly active users; ~80,510 daily active
users. A "**healthy customer**" (312 of them, representing ~148,000 users) is defined
as >80% seat activation and >500 active users.

---

## 3. Core features

Everything below is reflected — directly or indirectly — in the telemetry deck.

1. **Pipeline** — the visual board of open deals by stage. The rep's home base.
2. **Deal records** — one record per opportunity: value, stage, contacts, activity
   history, close date. "Pipeline value created" in the deck = the total value of new
   opportunities reps log here (e.g. Atlas Freight logged $5.1M in June).
3. **Activity logging** — reps log calls, emails, meetings, and notes against a deal.
   This is the "did the work" step of the daily flow.
4. **Global search** — the omnipresent search bar to jump to any account, deal, or
   contact, and to "open the pipeline." **This is the top of the daily-use funnel after
   login — and the current bottleneck (see §5).**
5. **Data-sync integrations** — two-way sync with email, calendar, and external systems.
   "Data-sync success rate" (99.1%) measures how many syncs complete without error.
6. **Reporting & forecasting** — dashboards for managers and RevOps; the source of the
   "Product Analytics" dashboard the telemetry deck is built from.
7. **AI Assist** *(launched May 15, 2026)* — an AI copilot embedded in the deal record
   and pipeline. It suggests next best actions, drafts follow-ups, and recommends which
   deals to prioritize. Reps **accept** suggestions inline. It is the newest and
   fastest-growing surface:
   - Deals closed with AI Assist: 1,240 → **4,320** (May→Jun)
   - Reps using AI Assist weekly: 3,200 → **11,800**
   - AI suggestions accepted: 18,000 → **62,400**
8. **Reliability & support** — 99.95% reliability index, 99.9%+ uptime, 97% support SLA
   attainment. The "Quality of Service" and "Running the Product" slides.

---

## 4. Login & onboarding experience

**Sign-in.** Reps reach HeroForce via a company sign-in (SSO for Growth/Enterprise;
email + password for Starter). After auth they land on the **rep home** — a personalized
"what to work on today" view: pipeline summary, deals needing attention, and (since May)
an **AI Assist** panel with suggested next actions.

**Onboarding.** New customers go through seat provisioning (admin invites reps → each
invite consumes a seat). A seat only counts as **activated** once that user signs in and
performs a meaningful action. "Seat activation" (share of purchased seats used at least
once) is a core health metric — healthy customers run >80%. Feedback in the deck calls
out onboarding directly: *"Onboarding new reps is finally painless."*

**First-run flow for a rep:**
1. Accept invite → set up profile / connect email + calendar (data-sync).
2. Land on rep home → see their assigned pipeline.
3. Run a search or open the pipeline to find a deal.
4. Open a deal, log the first activity.
5. Try AI Assist's suggested next action.

That first-run path is the same shape as the **daily-use funnel** below.

---

## 5. The daily-use flow — an activation model (worked out exactly)

This is the heartbeat of the product — what an active rep does **every day**. It is
deliberately **entry-path-agnostic**: after login a rep can reach their work several
equally-valid ways (click a deal off the pipeline board, follow a "needs attention"
item, open a notification/emailed link, use a saved view, or search). What the funnel
measures is **view vs. do** — did the rep just *see* their deals, or did they actually
*update* something? Numbers are June 2026 daily active users.

| Step | What we measure | Users | % of logins | Step drop |
|------|-----------------|-------|-------------|-----------|
| **1** | **Login** — reach the app | 80,510 | 100% | — |
| **2** | **Viewed their deals** — saw the pipeline / opened a record (an *impression*) | 74,100 | 92% | ▼ 8% |
| **3** | **Took a meaningful action** — updated a deal / logged activity / advanced a stage (a *write*) | 47,300 | 59% | **▼ 36%  ⟵ biggest drop-off** |
| **4** | **Returned the next day** — came back to keep working | 41,900 | 52% | ▼ 11% |

*(Weekly returning users — a broader, week-over-week measure — is 66% in the deck; the
52% above is the tighter next-day return within this daily cohort.)*

**The bottleneck is Step 2 → Step 3.** Reps have no trouble *reaching* their work —
74,100 of 80,510 (92%) log in and **view** their deals. But only 47,300 (59%) actually
**update** anything — a **36% fall**, by far the largest drop in the daily journey. The
gap isn't navigation or search (they clearly find their deals); it's that **reps look but
don't log**. This view-without-write pattern is what's dragging on daily active users
(80,510, down from 83,000) and is the flagged item on the deck's **Watchlist** slide.

> **Closing the view→do gap is the design target for the new feature.** Reps are *seeing*
> their pipeline but not *updating* it. The evidence pack in `data/` (metrics, feedback,
> user research, diagnostics) points to why — see §5.1.

### 5.1 Leading explanation — reps work away from the desk

The strongest read of the evidence (`data/`): **many reps are field/phone sellers who
are on calls or with customers all day.** They *glance* at HeroForce between calls (often
on mobile) to see what's next — clearing Step 2 — but find **updating the CRM too
cumbersome to do mid-call**, so the write (Step 3) slips to "later," and later often never
comes. It's not that they can't find their work; it's that **logging is friction they
won't pay while selling.**

Other hypotheses were considered and are weaker (see `data/diagnostics.md`):
- **Home/navigation problem?** No — Step 2 is 92%; reps reach and see their deals fine.
- **Mix shift (new users / managers)?** No — the view→do gap holds across tenure and role.
- **Empty pipeline / no leads?** No — accounts with healthy fresh lead flow show the same gap.
- **AI Assist layout change (May 15)?** No — the gap predates the launch.
- **Measurement artifact?** No — audited "no-update" sessions were genuinely read-only.

**Design implication:** the fix is **make updating effortless where reps already are** —
fast mobile/voice logging, one-tap "log this call," or AI Assist drafting the update from
a call so the rep just confirms. (A prettier Home won't help — they already see the work.)

---

## 6. Deck ↔ product coherence map

Every slide in **HeroForce Telemetry - June 2026** maps to a product reality:

| Deck slide | Product meaning |
|------------|-----------------|
| Executive Summary | Roll-up of the month across growth, engagement, quality, feedback |
| Impact Since AI Assist Launch | Adoption of the AI Assist feature (launched May 15, 2026) |
| Customer Reach & Adoption | Companies (8,420) + paying (5,180) + seats sold (268,400) + 412 new |
| Customer Mix | Customers by plan (Starter/Growth/Enterprise) and region |
| Healthy Customers | 312 customers >80% seat activation & >500 active users |
| Active Users | MAU 214,600 · **DAU 80,510 (dipped)** · weekly returning 66% |
| Quality of Service | Uptime 99.95% · data-sync 99.1% · search relevance 86% |
| Top Accounts by Pipeline Value | New opportunity value logged by reps (Atlas Freight $5.1M …) |
| How Users Feel | NPS 47, promoter/detractor counts, verbatim quotes |
| Running the Product | Reliability 99.95% · SLA 97% · gross margin 82% · **NRR 106% (softening)** |
| What Needs Attention (Watchlist) | Declining signals: **DAU** and **NRR** |
| Definitions | Glossary of the metrics above |

**Known watch-items (from the deck):**
- **Daily active users** ▼ (80,510, second dip) → traced to the **Step 2→3 view→do gap**:
  reps view their deals but don't update the CRM (they're on calls / away from desk).
- **Net revenue retention** ▼ (106%, second month) → higher down-sell in mid-market;
  renewals team engaged.

---

## 7. Top accounts (named in the deck)

The five largest / healthiest customers, reused consistently across the deck:

| Account | Seats | Active | Activation | June pipeline value |
|---------|-------|--------|------------|---------------------|
| Atlas Freight | 9,800 | 9,100 | 93% | $5.1M |
| Bluewave Retail | 8,200 | 7,400 | 90% | $3.8M |
| Corveto Health | 7,600 | 6,700 | 88% | $3.1M |
| Delmar Financial | 6,900 | 5,900 | 86% | $2.6M |
| Everline Media | 6,100 | 5,100 | 84% | $2.1M |

---

## 8. Brand & tone

- **Colors:** primary blue `#1B4DB3`, teal accent `#00B4A6`, purple `#6B4EFF`.
- **Voice:** plain, growth-lens, product-agnostic terminology — *customers* (not
  tenants), *users*, *seats*, *quality*, *feedback*. No internal/Microsoft-specific terms.
- **Positioning line:** *"The CRM that tells reps what to work on next — and helps them
  close it."*

---

*This document is the canonical product context for HeroForce. If you extend the deck or
build a feature, keep new details consistent with the numbers and flows above.*
