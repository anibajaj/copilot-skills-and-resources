# Product Growth Taxonomy

A reusable, product-neutral way to organize any product's telemetry into a story
executives understand. Use these dimensions to group whatever metrics a dashboard
exposes. **None of these terms are tied to any specific product** — translate
product jargon into this vocabulary before putting it on a slide.

> Translation rule: never use internal or vendor-specific nouns on a slide.
> Say **customers** (not "tenants"/"accounts"/"orgs"), **users** (not "seats"/
> "licenses"), **product quality** (not model/pipeline names), **user feedback**
> (not the name of the survey tool).

## The seven dimensions

| # | Dimension | The question it answers | Typical metrics |
|---|-----------|--------------------------|-----------------|
| 1 | **Reach & Adoption** | How many customers can and do use the product? | Total customers, addressable customers, customers by plan/segment, new customers added |
| 2 | **Customer Health / Depth** | How deeply have customers rolled it out? | "Healthy"/thriving customers, deployment coverage %, top customers by usage |
| 3 | **User Engagement** | How many people actually use it, how often? | Active users (monthly/weekly/daily), visitors, returning users, reach into the eligible base |
| 4 | **Product Quality** | How good is what the product produces/does? | Accuracy, precision/recall, reliability, error rate, latency |
| 5 | **Value Realized** | Are customers and users getting the intended benefit? | Customers/users reaching an outcome, feature depth, value events |
| 6 | **User Satisfaction & Feedback** | How do people feel about it? | Satisfaction score, positive/negative feedback counts, total responses, verbatims |
| 7 | **Operational & Business Health** | Is it reliable, high-quality to run, and cost-efficient? | Reliability/uptime index, engineering quality bar, unit cost |

Plus a narrative closer:

| — | **Milestones & Narrative** | What happened / what's next? | Key events, launches, upcoming work — **always filled manually, never auto-pulled** |

## How the People Skills deck maps onto this (worked example)

This is the abstraction that drove the generic skill. Left column = the specific,
product-coupled metric; right column = the generic dimension we present it under.

| Original (product-specific) metric | Generic dimension |
|---|---|
| Total tenants, Copilot tenants, ESES tenants, tenants by license/library type | **1. Reach & Adoption** |
| Healthy tenants, coverage %, top-10 tenants | **2. Customer Health / Depth** |
| LPC/LPE visitors & MAU | **3. User Engagement** |
| Inferencing F1 / precision / recall | **4. Product Quality** |
| SLR engaged tenants, active people, benefitted tenants | **5. Value Realized** |
| OCV CSAT, thumbs up/down, responses | **6. User Satisfaction & Feedback** |
| SFI, QEI, COGS | **7. Operational & Business Health** |
| Key events | **Milestones & Narrative** (manual) |

## Using it in the interview

When proposing metrics to a user, walk these dimensions in order and ask which
apply. A product rarely has all seven — pick the ones its dashboards can support,
and drop the rest rather than inventing data.
