# taxisbi-mvp monorepo

## Rules-as-BI Lifecycle Model

Canonical dataset lifecycle:

Source Data
-> Landing Layer
-> Certification Layer
-> Semantic Dataset Layer
-> Rulebook Execution Layer
-> Rendered Output

Scaffolding status:
- `landing/`, `certification/`, and `semantic/` layers are scaffolded as empty directories.
- `meta/` is scaffolded for certification metadata.
- No ingestion pipeline, certification job, or semantic promotion logic has been implemented in this step.

Schema naming conventions:
- `landing_*`: raw ingestion tables.
- `semantic_*`: trusted promoted datasets.
- `rulebook_*`: rulebook execution tables or projections.
- `meta_*`: certification metadata.

## Backend Source of Truth

The runtime backend/API code lives in `src/server`.

- Server entry: `src/server/index.ts`
- Route logic: `src/server/routes/*`
- ClickHouse integration: `src/server/clickhouse/*`

## `api` Folder Convention

The top-level `api` folder is not used for runtime server code in this repo.
If reintroduced later, it should be limited to API contracts/docs (for example OpenAPI files), not executable backend implementation.

## UI Language Guide

For consistent React/UI terminology and clearer implementation requests, see:

- `docs/react-terms.md`
