# Copilot Instructions for TaxisBI

## Project Purpose

TaxisBI is a Rules as BI system.

The product compiles constrained, human-readable analytics definitions into deterministic runtime behavior.
This repository is not a generic drag-and-drop BI tool, a free-form semantic modeling system, or an ad hoc query generator.

Optimize for:

- determinism
- explicit contracts
- constrained behavior
- maintainability
- readability
- boring, explainable architecture

Avoid magic solutions, hidden behavior, and overly clever abstractions.

## Current Repo Reality

Respect the current branch structure before proposing changes.

- Runtime server entry is currently in `src/index.ts`.
- Main npm scripts are in root `package.json` (`dev`, `build`, `typecheck`, `start`).
- `rulebooks/` is canonical terminology.
- `packs/` may still exist as legacy/scaffold content; do not add new features there.
- If folders for landing/certification/semantic/meta are missing, create scaffolding only when explicitly requested.

Do not assume older or alternate layouts such as `src/server/*` unless they actually exist in the current branch.

## Core Architecture Vocabulary

Use these terms consistently:

- Landing Layer: raw or lightly transformed incoming source data.
- Certification Layer: checks that landed data is fit for promotion.
- Semantic Dataset: trusted promoted business dataset with stable meaning.
- Rulebook: constrained analytics logic executed against semantic datasets.
- Profile: bounded interpretation or configuration variant applied within rulebook constraints.
- Archetype: supported source-ingestion pattern.

Preferred lifecycle:

Source Data
-> Landing Layer
-> Certification Layer
-> Semantic Dataset
-> Rulebook
-> Rendered Output

Important rules:

- Rulebooks must depend on semantic datasets, not landing tables.
- Semantic datasets represent business meaning.
- Rulebooks represent allowed analytics behavior.
- Certification determines whether data is ready for semantic promotion.
- Do not blur layer responsibilities unless explicitly asked.

## Technical Style

Prefer:

- TypeScript-first, explicit types.
- simple functions over deep abstraction.
- clear naming over short naming.
- explicit data flow over framework magic.
- pure/helper functions where practical.
- small focused modules.
- comments that explain why, not obvious what.

Avoid:

- unnecessary dependency additions.
- speculative abstractions.
- generic enterprise patterns that add ceremony without value.
- hidden mutation.
- implicit cross-layer coupling.
- smart code that obscures runtime behavior.

## Product Constraints

Do not introduce patterns that imply:

- free-form end-user data modeling.
- arbitrary metric creation.
- unrestricted field selection.
- direct querying of raw source tables by runtime UI components.
- uncontrolled source-specific branching inside rulebooks.

If a design choice would make the system feel like a traditional BI tool, prefer the more constrained option.

## Data Modeling Guidance

When working with data-related code:

- preserve grain explicitly.
- make business meaning visible in names.
- keep source-specific logic out of rulebooks.
- prefer versioned semantic dataset names when appropriate.
- prefer deterministic transformations.
- keep ingestion/source variability before the semantic dataset boundary.
- do not treat source table names as stable business meaning.

Examples of good names:

- `open_ar_items_v1`
- `gl_line_items_v1`
- `trial_balance_periodic_v1`

Examples of poor names:

- `final_table`
- `transformed_data`
- `rulebook_output`
- `temp_business_view`

## Refactoring Guidance

When refactoring:

- preserve business logic unless the task explicitly asks for logic changes.
- prefer small targeted edits.
- keep imports, naming, and comments aligned.
- call out ambiguous naming or architectural drift.
- do not invent missing services or pipeline logic unless explicitly requested.

If introducing new architecture folders that do not yet exist, create scaffolding only, such as folders with `.gitkeep`.

## Testing and Verification

When changing code, prefer to run:

- `npm run typecheck`
- `npm run build` (when relevant)

Do not claim code is fully validated unless checks were actually run.

## Communication Style in Suggestions

When proposing changes:

- be concrete.
- explain tradeoffs briefly.
- prefer practical implementation steps.
- surface uncertainty rather than guessing.
- flag architecture violations explicitly.

When in doubt, choose the option that is simpler, more deterministic, and more aligned with Rules as BI.
