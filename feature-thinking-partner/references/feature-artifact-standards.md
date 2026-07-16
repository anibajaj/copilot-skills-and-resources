# Feature Artifact Review Guide

This guide is derived from the ways feature proposals commonly fail. It is a review aid, not a substitute for product judgment.

## Problem and Evidence

- The statement names a user, job, friction, cause, and consequence.
- The proposed UI is not disguised as the problem statement.
- Evidence is separated from hypotheses and opinions.
- Prevalence, frequency, severity, and impact are not conflated.
- Contradictory evidence is retained.
- Unknown facts are marked `[TBD]`.

## Opportunity

- The outcome metric represents value rather than activity alone.
- Leading and guardrail metrics are included.
- Impact calculations expose formulas and assumptions.
- Low, expected, and high cases are used when uncertainty is material.
- The largest sensitivity drivers are named.

## Solution Quality

- The alternatives differ in mechanism, not only presentation.
- The recommendation traces to the problem and evidence.
- Rejected alternatives and trade-offs are documented.
- The user explicitly selected the direction.
- The flow covers entry, happy path, alternate states, recovery, and exit.

## Evaluation Quality

- Important requirements have an evaluation method.
- Behavior correctness, user outcome, and product outcome are all tested.
- Thresholds are grounded or marked `[TBD]`.
- The prototype can answer at least one important usability question.
- Telemetry measures exposure, action, success, failure, and abandonment where relevant.

## Priority Quality

- Every P0 has a specific launch-blocking rationale.
- P1 items can be deferred without invalidating the core test.
- P2 items are genuine improvements or extensions.
- Non-goals prevent attractive extras from silently entering scope.
- Priority does not substitute for sequencing, complexity, or confidence.

## Four-Risk Review

- Problem-value: the problem and solution are worth the investment.
- Use-and-understanding: users can discover, understand, trust, and use it.
- Delivery-and-operation: it can be built and operated reliably.
- Sustainable-product: strategic, economic, trust, policy, and ecosystem effects are acceptable.

## Prototype

- A first-time viewer can understand the feature without narration.
- New behavior is visibly distinguished from existing behavior.
- Annotations explain the user action, system action, change, and purpose.
- Controls, state changes, Back, Restart, and important recovery paths work.
- The experience is keyboard usable, responsive, and high contrast.
- Sample data is labeled.

## PRD

- Evidence, alternatives, selected solution, requirements, evaluation, risks, and decisions are present.
- Requirements are atomic, testable, and consistently identified.
- Every sourced statement is cited.
- Every estimate is labeled as an estimate.
- Open questions and assumptions are easy to find.
- Main tables span the full usable page width.
- Portrait tables use no more than five columns unless the layout has been visually proven readable.
- Requirement tables prioritize width for requirement text and acceptance criteria rather than squeezing every field into one row.
- No table text is below 9 pt, clipped, hidden, off-page, or compressed into unreadable columns.
- Every page has been rendered and visually inspected before publishing.
- Any page changed after visual QA has been re-rendered and rechecked.

## Cross-Artifact Consistency

- Every visible P0 behavior appears in the prototype.
- Every prototype change maps to requirement IDs.
- Flow, scope, terminology, and priorities match.
- Evaluation intent maps to actual behaviors and metrics.
- No unresolved gap is hidden by polished language.
