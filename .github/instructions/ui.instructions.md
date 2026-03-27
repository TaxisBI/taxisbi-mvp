---
description: "Use when editing UI code in the ui folder, including TypeScript UI files and HTML shell content. Enforces constrained UX patterns and avoids open-ended BI authoring behavior."
name: "UI Scoped Guidance"
applyTo:
  - "ui/**/*.ts"
  - "ui/**/*.tsx"
  - "ui/**/*.html"
---
# UI Scoped Guidance

- Keep UI behavior constrained and deterministic.
- Avoid UI affordances that imply free-form data modeling, arbitrary metric creation, or unrestricted field selection.
- Prefer explicit controls and bounded choices over dynamic free-form input.
- Keep terminology aligned with rulebook, landing, certification, and semantic dataset language.
- When introducing UI options, ensure they map to governed runtime behavior rather than ad hoc query behavior.
- Preserve current runtime contracts unless a change is explicitly requested.
