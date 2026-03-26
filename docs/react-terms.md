# React Terms and Phrasing Guide

This guide helps describe React UI work with clear, consistent wording.

## Why This Exists

Teams often mix terms like component, element, node, and prop. That causes confusion in tickets, reviews, and design handoff notes.

Use this guide when writing:
- bug reports
- implementation requests
- PR descriptions
- code review comments

## Core React Terms

- Component: A reusable unit of UI logic, usually a function in modern React.
- Element: The object returned by JSX (what React uses to describe UI).
- JSX: Syntax that looks like HTML but compiles to React element creation.
- Props: Inputs passed to a component.
- State: Mutable local data owned by a component.
- Hook: A function like useState/useEffect for stateful logic in function components.
- Render: Producing elements from component logic.
- Re-render: Running render again because props/state/context changed.
- Context: Shared data available to a component subtree without prop drilling.
- Ref: Mutable reference to a DOM node or value that does not trigger re-renders.

## UI Structure Terms (Use These in Requests)

- Page: Full route-level screen.
- Section: Major visual grouping inside a page.
- Panel: Boxed sub-area, often side-by-side with others.
- Row: Horizontal grouping of related controls/content.
- Control: Interactive input (button, select, checkbox, slider, etc.).
- Group: Logical cluster of controls, often under a title.
- Accordion: Expand/collapse container with one or more sections.
- Nested group: Expand/collapse group inside another group.

## Styling and Layout Terms

- Container: Wrapper element controlling width and spacing.
- Viewport: Visible browser area.
- Overflow: Content extending beyond container bounds.
- Breakpoint: Width threshold where responsive layout changes.
- Alignment: How elements line up (left/center/right, baseline, etc.).
- Spacing: Margin/gap/padding behavior.

## Data and Interaction Terms

- Loading state: UI shown while data is being fetched.
- Empty state: UI shown when there is no data to display.
- Error state: UI shown when fetch or processing fails.
- Hover state: Styling shown only while pointer is over an element.
- Focus state: Styling for keyboard/screen-reader navigation focus.
- Disabled state: Control visible but not interactive.

## Better Phrasing Patterns

Use this pattern:
- Scope + Element + Behavior + Expected result

Examples:
- In the Theme Builder left panel, make the Theme Elements accordion collapsed by default.
- In the Base Theme row, keep the select width within the viewport at all breakpoints.
- In the preview chart, apply hover color only during hover, not at rest.

## Ambiguous vs Clear Wording

Instead of:
- "the folder thing is off"

Say:
- "the Theme Elements accordion header is misaligned with the panel content"

Instead of:
- "the color is wrong"

Say:
- "the bar default fill should use chartBarDefaultColor when no hover selection is active"

Instead of:
- "make it responsive"

Say:
- "at widths below 900px, stack controls into a single column and prevent horizontal overflow"

## Practical Request Template

Use this template for UI requests:

1. Scope: page/section/component
2. Current behavior: what happens now
3. Desired behavior: exact expected behavior
4. Constraints: responsive rules, accessibility, performance, naming
5. Acceptance checks: what to verify after implementation

Example:
- Scope: Theme Builder left panel
- Current behavior: Colors subgroups start expanded
- Desired behavior: Theme Elements expanded, child groups collapsed, color subgroups collapsed
- Constraints: preserve keyboard accessibility and existing token filtering
- Acceptance checks: reload page and confirm collapse defaults persist

## Review Vocabulary (Useful in PR Comments)

- Functional regression
- Visual regression
- State mismatch
- Interaction edge case
- Responsive overflow
- Accessibility issue
- Naming ambiguity
- Missing loading/error handling

## Quick Glossary for Common Confusions

- React element vs DOM element:
  - React element is the JS description.
  - DOM element is the actual browser node after render.

- Component vs instance:
  - Component is the definition (function).
  - Instance is the rendered usage in the tree.

- Prop vs state:
  - Prop comes from parent.
  - State is owned by the component.

- Expand/collapse vs show/hide:
  - Expand/collapse usually implies an accordion pattern.
  - Show/hide is generic visibility.

## Suggested Default Terms for This Repo

When discussing Theme Builder UI:
- Parent group: Theme Elements accordion
- Child groups: Typography, Visual Density, Colors
- Nested groups: Color category groups
- Chart area: Theme preview chart panel
- Top row: Base Theme control row
