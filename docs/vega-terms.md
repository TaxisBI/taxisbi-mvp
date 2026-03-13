# Vega and Vega-Lite Terms Catalog

This is a practical terminology reference for chart configuration discussions in this repo.

## Official References

There is no single official "dictionary" page that lists every term in one place.
Use these as the canonical sources:

- Vega-Lite docs: https://vega.github.io/vega-lite/docs/
- Vega docs: https://vega.github.io/vega/docs/
- Vega-Lite JSON schema: https://vega.github.io/schema/vega-lite/v6.json
- Vega JSON schema: https://vega.github.io/schema/vega/v6.json

## Core Vocabulary

- Specification (spec): The full JSON chart definition.
- Data: Input records for the visualization.
- Transform: Data processing steps before drawing (calculate, filter, aggregate, etc.).
- Mark: A geometric primitive (bar, line, area, point, text, rule, rect, arc, etc.).
- Encoding: Mapping data fields to visual channels.
- Channel: Visual slot such as x, y, color, opacity, size, shape, text, stroke, tooltip.
- Scale: Mapping from data domain to visual range.
- Axis: Visual guide for positional scales (x/y).
- Legend: Visual guide for non-positional channels (color, size, shape).
- Layer: Multiple mark definitions rendered together in one chart.
- Facet: Repeating chart panels by a field.
- Repeat: Repeating spec with different fields.
- Concat: Combining multiple charts (hconcat, vconcat, concat).
- Composition: Any multi-view arrangement (layer, facet, concat, repeat).

## Mark Styling Terms (Precise)

These names are the proper terms to use instead of generic words like "line color":

- fill: Interior color of a filled mark.
- fillOpacity: Opacity of mark interior.
- stroke: Outline color.
- strokeOpacity: Opacity of outline.
- strokeWidth: Outline thickness.
- opacity: Overall mark opacity.
- cornerRadius / cornerRadiusEnd: Rounded bar or rect corners.
- size: Mark size (for point-like marks, and sometimes line thickness depending on mark type).
- orient: Orientation hint for marks like bar or area.
- interpolate: Curve style for line/area.

## Text Mark Terms

- text: The label content channel.
- font: Font family.
- fontSize: Text size.
- fontWeight: Weight (normal, bold, number).
- align: Horizontal text alignment.
- baseline: Vertical alignment reference.
- angle: Rotation.
- dx / dy: Pixel offsets.

## Positional and Quantitative Channels

- x, y: Positional channels.
- x2, y2: Secondary positional channels (ranges).
- theta, radius: Polar channels.
- color: Color channel.
- size: Size channel.
- shape: Shape channel.
- opacity: Opacity channel.
- tooltip: Tooltip content channel.
- order: Draw/order sequencing channel.
- detail: Grouping channel without visual legend.

## Interaction Terms

- params (Vega-Lite): Named parameters for interaction/state.
- select: Selection definition in a param.
- point selection: Select discrete tuples.
- interval selection: Brush/range selection.
- on: Event trigger (example: mouseover).
- clear: Event that clears selection state.
- condition: Conditional encoding based on predicate or param.
- empty: Behavior when selection is empty (`true` or `false`).

## Vega-Specific Terms

- signal: Reactive variable in Vega runtime.
- event stream: Event definition for signal updates.
- encode block: Vega mark encoding sections (enter, update, hover, etc.).
- scenegraph: Runtime tree of rendered visual items.
- scales, axes, legends (Vega): Explicit top-level objects, not only inferred.

## Common Precision Examples

Use these precise terms in reviews and tickets:

- Say "increase `strokeWidth` on hover" (not "make line thicker").
- Say "change bar `fill` on selection" (not "change bar color").
- Say "lower non-hover `opacity` to 0.7" (not "fade others a bit").
- Say "set `strokeOpacity` to 1" (not "make border more visible").

## Repo Usage Notes

In this repo, hover behavior is currently implemented with a layer-local param on the bar layer (`barHoverLocal`) and conditional channels for bar styling.
