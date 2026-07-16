# copilot-skills-and-resources

A collection of **product-agnostic** skills and resources you can drop into any
Copilot / agent workflow — no matter what product, dashboard, or vendor you work
with. Everything here is written to be reusable and free of product-specific
vocabulary.

> ## ⚠️ Disclaimer
>
> This repository is intended for **skilling, training, and building user
> knowledge** — learning how to work with Copilot/agent skills and reusable
> resources. Any sample data included (e.g. the mock product dataset) is
> **fictional** and provided purely for demonstration.
>
> **Before using anything here for enterprise or production purposes, review and
> validate it yourself** — check for suitability, security, compliance, licensing,
> and data-handling requirements against your organization's policies. It is
> provided "as is" with no warranty (see [License](#license)).

## Skills

| Skill | What it does |
|-------|--------------|
| [`deck-generator/`](./deck-generator/) | Turn any product's telemetry into a clean, executive **monthly growth/telemetry deck** (`.pptx`). Interactive on first run: introduces itself, asks which dashboards/data sources to pull from, helps pick metrics through a universal product-growth lens, then renders a config-driven deck. |
| [`feature-thinking-partner/`](./feature-thinking-partner/) | An interactive **product thinking partner** that takes a rough feature idea through problem framing, evidence, impact sizing, solution options, user-flow design, and prioritized requirements — then produces an annotated clickable **HTML prototype** and a detailed **Word PRD**. |

## Using a skill

Each skill folder is self-contained with its own `SKILL.md` (the interactive
protocol an agent follows) and a `README.md` (human quick-start). To run the
deck generator directly:

```bash
cd deck-generator
npm install
node generate-deck.js examples/deck-config.example.json "Acme Cloud Telemetry - May 2026.pptx"
```

See [`deck-generator/README.md`](./deck-generator/README.md) for full details.

## Resources

| Resource | What it is |
|----------|------------|
| [`mock product data/`](./mock%20product%20data/) | A complete, realistic **mock product dataset** for a fictional B2B SaaS CRM ("HeroForce"). Includes a product-context briefing, an app mockup + screenshot, monthly metrics, user feedback, and user-research personas — all internally coherent. Handy for testing or demoing any skill (like the deck generator) without touching real product data. |

## Contributing

New skills are welcome. Keep them **product-neutral**, self-contained in their own
folder, and documented with both a `SKILL.md` (agent protocol) and a `README.md`
(human-facing).

## License

Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](./LICENSE).
You're free to share and adapt this material for any purpose, including commercially,
as long as you give appropriate credit.

© 2026 anibajaj. Please attribute as: "copilot-skills-and-resources by anibajaj,
licensed under CC BY 4.0."
