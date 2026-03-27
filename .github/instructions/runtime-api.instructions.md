---
description: "Use when editing backend runtime files under src. Covers API safety, deterministic behavior, and non-breaking refactor expectations for this repository."
name: "Runtime API Scoped Guidance"
applyTo:
  - "src/**/*.ts"
---
# Runtime API Scoped Guidance

- Treat `src/index.ts` as the runtime entrypoint unless the repo structure explicitly changes.
- Preserve runtime behavior unless the task explicitly asks for logic changes.
- Prefer small, explicit functions and clear data flow.
- Keep request/response contracts stable; avoid hidden behavior and side effects.
- Do not introduce pipeline implementations for landing, certification, semantic, or metadata layers unless explicitly requested.
- Use existing scripts (`npm run typecheck`, `npm run build`) to validate changes when relevant.
