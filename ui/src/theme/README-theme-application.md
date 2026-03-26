# Universal Theme Application for Charts

## Overview
Themes in TaxisBI are defined generically and can be applied to any chart. The Theme Builder creates themes with a standard schema, and charts consume them via a shared utility.

## How to Apply a Theme to Any Chart

1. **Fetch the ThemeDefinition**
   - Use the theme registry/API to load the theme for the current domain, rulebook, chart, or dashboard.

2. **Use the Utility**
   - Import and use `applyThemeToChart` from `ui/src/theme/applyThemeToChart.ts`.
   - Example:
     ```ts
     import { applyThemeToChart } from '../../theme/applyThemeToChart';
     const chartTheme = applyThemeToChart(themeDefinition);
     ```

3. **Pass Theme Settings to Chart Renderer**
   - Pass the resolved settings to your chart renderer (e.g., VegaChartRenderer).
   - Example:
     ```tsx
     <VegaChartRenderer
       spec={spec}
       cardBackground={chartTheme.cardBackground}
       cardShadow={chartTheme.cardShadow}
       tooltipTheme={chartTheme.tooltipTheme}
       // ...other theme props
     />
     ```

## Benefits
- Themes are not tied to a specific chart or domain.
- Any chart can consume and apply a theme using the same pattern.
- Theme Builder and chart preview use the same logic.

## Extending
- Add new theme properties to `applyThemeToChart` as needed.
- Charts can use additional theme fields for custom surfaces.

## Example
See `ui/src/reports/ar/aging-bucket/components/ARAgingBucketChart.tsx` for a refactored chart using universal theme consumption.

