# Current State Notes

This document summarizes the current working setup, engineering principles, and key repository areas for the TaxisBI MVP.

## What TaxisBI Is Right Now

TaxisBI is a rules-driven analytics MVP focused on fast iteration over domain packs and chart experiences.

Current stack:
- Backend: Node.js + TypeScript (Express)
- Database: ClickHouse
- Frontend: React + Vite + Vega-Lite rendering
- Pack artifacts: SQL + chart specs + seed/schema files on disk

## Current Runtime Setup (Local Dev)

Local development is intentionally hybrid:
- ClickHouse runs in Docker.
- API runs on host via npm scripts.
- UI runs on host via npm scripts.

This keeps startup simple and makes UI and API iteration faster while the MVP is still changing rapidly.

## Core Principles (Current)

1. Metadata is the product, code is the runtime.
2. Prefer configuration/artifacts over one-off handlers.
3. Keep runtime modules small and readable.
4. Add new charts by dropping files, not writing custom endpoint code.
5. Keep conventions deterministic and explicit.

## Chart Runtime Model (MVP)

The backend now supports a generic chart endpoint:
- GET /api/charts/:domain/:pack/:chart

Current convention mapping:
- chart spec: domains/{Domain}/packs/{Pack}/charts/{chart}.vl.json
- query SQL: domains/{Domain}/packs/{Pack}/queries/{chart}.sql

Route behavior:
1. Resolve domain/pack/chart paths from request params.
2. Load Vega-Lite spec JSON from disk.
3. Load SQL query from disk.
4. Execute SQL in ClickHouse (JSONEachRow).
5. Return JSON payload:
   - spec
   - data

Error behavior:
- 404 when a pack/chart/spec/query artifact cannot be found.
- 500 when query execution or runtime processing fails.

## Key Repository Areas

### Runtime server
- src/server/index.ts: Express entrypoint, health route, theme routes, chart route wiring.
- src/server/routes/charts.ts: Generic metadata-driven chart route.
- src/server/packs/resolvePackPaths.ts: Domain/pack/chart path resolution and artifact path construction.
- src/server/packs/loadChartSpec.ts: Loads and parses chart spec JSON.
- src/server/packs/loadQuerySql.ts: Loads SQL text.
- src/server/packs/getChartPayload.ts: Orchestrates load + query + response payload.
- src/server/clickhouse/client.ts: ClickHouse client initialization.

### Domain packs and artifacts
- domains/: Domain-specific packs and analytics assets.
- domains/AR/packs/Receivable_item: Current AR MVP pack.
- schema.sql and seed.sql: Data model and seed setup per pack.
- queries/: SQL artifacts for chart-ready data.
- charts/: Vega-Lite specs used by the generic runtime.
- pack.yaml: Pack metadata placeholder for current and future mapping concerns.

### UI application
- ui/src/reports/ar/aging-bucket: Current AR chart page and components.
- ui/src/charts/components/VegaChartRenderer.tsx: Vega chart rendering component.
- ui/src/theme/*: Theme loading, editing, and persistence flow.

### Infrastructure and operations
- docker/docker-compose.yml: ClickHouse container orchestration for local dev.
- scripts/dev-start.js and scripts/dev-stop.js: Local service start/stop orchestration.
- scripts/dev-guard.js: Guard/start behavior for API process during dev startup.

### Product and architecture docs
- docs/futurestate.md: Near-term future architecture direction.
- docs/vega-terms.md: Vega/Vega-Lite vocabulary and precision reference.
- docs/react-terms.md: React and UI terminology guide for clearer requests and reviews.
- docs/uitest.md: UI test-related notes.

## Pack Structure (Current Convention)

Example structure in active AR pack:
- domains/
  - AR/
    - packs/
      - Receivable_item/
        - schema.sql
        - seed.sql
        - pack.yaml
        - queries/
          - aging_by_bucket.sql
        - charts/
          - aging_by_bucket.vl.json

## What Is Intentionally Not Overbuilt Yet

- No full chart-to-query mapping model in pack.yaml yet (convention-first MVP).
- No separate custom API route per chart.
- No full containerized API+UI stack yet.
- No large framework around packs; simple modules by responsibility.

## Practical Current Workflow

To add a new chart in this MVP model:
1. Add a SQL file in pack queries with the chart name.
2. Add a Vega-Lite spec in pack charts with the same chart name.
3. Call /api/charts/{domain}/{pack}/{chart} from UI.

The runtime discovers and executes chart artifacts without adding new TypeScript route handlers.
