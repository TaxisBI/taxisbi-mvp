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

### UI tokens for report bars

Themes can define hover visuals for report bar charts under `ui`:

- `chartBarDefaultColor`
- `chartBarHoverColor`
- `chartBarDefaultOpacity`
- `chartBarHoverOpacity`
- `chartBarDefaultStrokeColor`
- `chartBarHoverStrokeColor`
- `chartBarDefaultStrokeOpacity`
- `chartBarHoverStrokeOpacity`
- `chartBarDefaultStrokeWidth`
- `chartBarHoverStrokeWidth`

These tokens are consumed by AR aging chart rendering so the active theme controls bar hover behavior.

### Reusable color token scaffold

Themes can also define reusable color families under `ui.colorTokens` for chart element mapping:

- `mono`: monocolor hex values with `light`/`dark` variants.
- `multi`: multi-color hex arrays with `light`/`dark` variants.
- `sentiment`: `positive` / `neutral` / `negative` with `light`/`dark` variants.
- `status`: `error` and `warning` with `light`/`dark` variants.

These tokens are intended as a shared palette contract so users can map theme-selected colors to any Vega/Vega-Lite element that accepts colors.

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
