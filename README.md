# copilot-skills-and-resources

A collection of **product-agnostic** skills and resources you can drop into any
Copilot / agent workflow — no matter what product, dashboard, or vendor you work
with. Everything here is written to be reusable and free of product-specific
vocabulary.

## Skills

| Skill | What it does |
|-------|--------------|
| [`deck-generator/`](./deck-generator/) | Turn any product's telemetry into a clean, executive **monthly growth/telemetry deck** (`.pptx`). Interactive on first run: introduces itself, asks which dashboards/data sources to pull from, helps pick metrics through a universal product-growth lens, then renders a config-driven deck. |

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

## Contributing

New skills are welcome. Keep them **product-neutral**, self-contained in their own
folder, and documented with both a `SKILL.md` (agent protocol) and a `README.md`
(human-facing).

## License

[MIT](./LICENSE) — free to use, modify, and share.
