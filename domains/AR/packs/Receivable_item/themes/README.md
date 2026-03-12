# Chart Themes

This folder contains built-in chart themes for the `Receivable_item` pack.

## Files

- `light.v1.json`: Default light theme
- `dark.v1.json`: Default dark theme
- `ember-dark.v1.json`: Orange-accent dark theme
- `theme.schema.v1.json`: Informal JSON schema contract for theme payloads

## Theme Structure

Each theme file uses this shape:

- `key`: unique theme id
- `label`: display name
- `ui`: container/page colors used by UI wrappers
- `spec`: Vega-Lite spec overrides merged on top of base chart spec

These files are intended as system defaults. User-created themes should be stored in a persistent data store and merged using the same shape.
