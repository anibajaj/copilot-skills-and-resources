# Feature Thinking Partner

A Cowork skill that guides a product manager from a rough feature idea to an evidence-backed product proposal, an annotated clickable HTML prototype, and a detailed Word PRD.

## What it does

1. Builds and reuses a product context profile, including product documentation, repositories, research sources, supporting skills, Figma or screenshots, and sample PRDs.
2. Frames the user problem before committing to a solution.
3. Researches whether the problem is real and estimates its potential impact.
4. Explores multiple solution approaches and recommends a direction while leaving the final choice to the user.
5. Designs the end-to-end flow, including alternate, error, permission, and recovery states.
6. Defines evaluation intent and prioritized P0, P1, and P2 requirements.
7. Reviews value, usability, delivery, operational, and sustainability risks.
8. Creates an annotated, clickable HTML prototype grounded in approved Figma designs or screenshots.
9. Creates a detailed Word PRD using a supplied sample PRD or a professional default design.
10. Cross-checks the prototype and PRD before delivery.

## How the conversation works

At every decision point, the skill:

- Starts with a short executive summary.
- Places optional supporting detail below it.
- States the decision that will be needed.
- Waits for the user to reply **OK**.
- Then asks the user to make the decision.

Research, opportunity sizing, P0 assessment, evaluation, and risk analysis stay concise in chat. Complete details are preserved in the working record and final PRD.

## Required inputs

The skill attempts to find saved context before asking the user again. Important inputs include:

- Product documentation or repository context
- Customer feedback, research, and telemetry sources
- Figma designs, screenshots, or visual exports for prototype grounding
- An optional sample PRD, feature specification, or Word template

A sample PRD is optional. When none is supplied, the skill uses its own professional PRD structure and design. Product visuals are required before prototype creation.

## Outputs

- A self-contained annotated HTML prototype
- A professional Word PRD
- A decision log
- Prioritized requirements and acceptance criteria
- Evaluation and measurement guidance
- Risks, assumptions, and recommended next validation steps

## Quality safeguards

- Never invents evidence, telemetry, quotes, metrics, users, or sources.
- Does not make every requirement P0.
- Does not create a prototype without approved product visuals.
- Builds the PRD privately and publishes it only after structural and page-by-page visual QA.
- Requires tables to use the full available page width and blocks clipped, compressed, or hidden text.
- Keeps the prototype, PRD, requirements, metrics, and decisions consistent.

## Example prompts

- "Help me think through this feature idea."
- "Pressure-test this product problem."
- "Turn this idea into a PRD and annotated prototype."
- "Explore solutions and define prioritized requirements for this feature."

## Files

- `SKILL.md` - the skill workflow and guardrails
- `README.md` - this overview
- `references/product-context-template.md` - reusable product context structure
- `references/feature-artifact-standards.md` - prototype and PRD review checklist
