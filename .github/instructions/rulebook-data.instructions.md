---
description: "Use when editing rulebook SQL/YAML artifacts, data naming conventions, or lifecycle architecture assets in rulebooks and related docs."
name: "Rulebook and Data Scoped Guidance"
applyTo:
  - "rulebooks/**/*.sql"
  - "rulebooks/**/*.yaml"
  - "rulebooks/**/*.yml"
  - "rulebooks/**/*.json"
  - "docs/currentstate.md"
  - "docs/futurestate.md"
---
# Rulebook and Data Scoped Guidance

- Keep canonical terminology: rulebook, landing, certification, semantic dataset.
- Preserve grain explicitly and use business-meaningful names.
- Prefer versioned semantic dataset names when appropriate (example: `open_ar_items_v1`).
- Rulebook logic should depend on semantic datasets, not landing tables.
- If a task introduces new lifecycle folders, create scaffolding only (`.gitkeep`) unless implementation is explicitly requested.
- Do not invent ingestion, certification, or promotion pipelines in this scope unless explicitly asked.
