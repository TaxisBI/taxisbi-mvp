# Theme Hierarchy

Themes are stored at the repository level to support broad reusable defaults and narrower overrides.

## Folder layout

- `themes/1_global/`: Broad themes usable by any chart.
- `themes/2_domain/<DOMAIN>/`: Domain-level themes (e.g. AR).
- `themes/3_pack/<DOMAIN>/<PACK>/`: Pack-level themes.
- `themes/4_dashboard/`: Dashboard-level themes.

## Theme model

Each theme can define:

- `key`: unique theme key.
- `label`: display name.
- `extends`: parent theme key to fork from.
- `scope`: `global | domain | pack | dashboard`.
- `appliesTo`: optional targeting constraints.
- `ui`: UI token overrides.
- `spec`: Vega-Lite overrides.

### appliesTo

`appliesTo` can include one or more of:

- `domain`
- `pack`
- `chart`
- `dashboard`

Examples:

- Global theme: no `appliesTo`.
- AR domain theme: `{ "domain": ["AR"] }`
- Pack theme: `{ "domain": ["AR"], "pack": ["Receivable_item"] }`
- Chart-specific theme: `{ "domain": ["AR"], "pack": ["Receivable_item"], "chart": ["aging_by_bucket"] }`

## Inheritance

Use `extends` to fork from another theme key. Child values override parent values.
