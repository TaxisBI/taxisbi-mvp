# Future State Notes

This file tracks near-term architecture decisions and productization TODOs.

## Containerization: Current Decision

We are not doing full containerization right now.

Current local dev model:
- ClickHouse runs in Docker.
- API runs on host via npm scripts.
- UI (Vite + Vega rendering) runs on host via npm scripts.

Why this is the current choice:
- Faster feedback loop for UI development.
- Less complexity while MVP features are still changing.
- Avoid Windows volume-mount and hot-reload friction during active development.

## TODO: Full Product Containerization

When moving toward full product development and repeatable environments, revisit full containerization.

Target future state:
- API container.
- UI container for dev and/or static UI served by API/nginx in production.
- ClickHouse container with explicit bootstrap/init strategy.
- Single orchestration flow for local and CI environments.

Suggested readiness triggers:
- Team onboarding friction increases.
- Environment drift causes repeated setup bugs.
- CI/CD and deployment parity become higher priority than local speed.

## Future Work Checklist

## Dataset Lifecycle Expansion

Lifecycle target:
- Source Data -> Landing -> Certification -> Semantic Dataset -> Rulebook -> Rendered Output

Scaffolded now (no implementation yet):
- `domains/*/landing/`
- `domains/*/certification/`
- `domains/*/semantic/`
- `meta/`

Planned metadata namespace objects:
- `meta.certification_runs`
- `meta.certification_results`
- `meta.dataset_certifications`

- [ ] Define container boundaries for API, UI, and data services.
- [ ] Add Dockerfiles for API and UI.
- [ ] Extend compose for full-stack local bring-up.
- [ ] Add production image build and tagging strategy.
- [ ] Add health checks and startup dependency ordering.
- [ ] Add documented runbooks for local, staging, and production.
- [ ] Add landing ingestion flows.
- [ ] Add certification run/result workflows.
- [ ] Add semantic dataset promotion workflows.
