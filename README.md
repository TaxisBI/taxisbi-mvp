# taxisbi-mvp monorepo

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
