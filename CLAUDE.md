# Spatial Engine

## What This Is

A UI engine where everything is a continuous weight field. No pages, no discrete states, no modes. Just space, weight, and depth.

The entire app is a single navigable space. Every element is a node in a tree. Every node has a weight. The layout distributes space proportionally to weights. Interaction = perturbing the weight field.

## Core Principles

**Everything is continuous.** There are no `isOpen`, `isExpanded`, `isFocused` booleans anywhere. Nodes have a numeric weight that flows between values. Visual states emerge from the weight distribution.

**The cursor is a field, not a pointer.** Hover applies a gaussian influence — all nodes respond based on their distance from the mouse. No binary hovered/not-hovered.

**Layout is stable.** Row assignments are computed once from base weights and never change. When weights change (hover or click), nodes expand/compress within their fixed row. No node ever jumps to a different row.

**Clicks bubble up intelligently.** Clicking a child expands it AND expands its ancestors — but only ancestors that aren't already expanded. Once you're "inside" a level, clicks stay at that level.

## Architecture

```
src/
  engine/
    treemap.js        — Stable grid: computeRowPlan (once) + squarify (every frame)
    weights.js        — Weight state: applyClick with continuous boost (no checkpoints)
    semanticScale.js  — f(S,W): containerWidth × semantic weight → fontSize/opacity/padding
    textMeasure.js    — pretext wrapper with caching
  components/
    SpatialNode.jsx   — The recursive primitive. Receives rect, renders text + sub-treemap.
    SpatialText.jsx   — Text that scales with f(S,W), centered, opacity from semantic scale.
  hooks/
    useSpatialState.js — Nested weight management + rAF animation loop + click bubbling
    useHover.js        — Gaussian hover field: mousePos + hoverIntensity via rAF
    useWeightAnimation.js — (unused, superseded by rAF in useSpatialState)
  data/
    tree.js           — Test tree definition with semantic layers
```

## Key Design Decisions

### Two-phase treemap layout
1. `computeRowPlan(items)` — determines row groupings from base weights on a normalized 1×1 square. Size-independent. Called once per node.
2. `squarify(items, rect, rowPlan)` — distributes space using current weights within the fixed row plan. Called every frame.

### Gaussian hover field
Mouse position tracked as `{x, y}` pixels. For each node, hover weight = `BOOST * exp(-distSq * SIGMA) * hoverIntensity`. All nodes get partial influence, smooth crossfade between them.

### Click bubbling with hierarchy awareness
`handleClickNode` boosts the clicked node at its level, then walks up the parent map. If an ancestor is already boosted (`target > base + 0.5`), it stops — we're "inside" that level.

### Weight animation
Single rAF loop in `useSpatialState` animates all `current` values toward `target` with ease-in-out: `rate = (0.1 + remaining * 0.9) * speed * dt`.

### Semantic text scaling
`fontSize = clamp(containerWidth * W * 0.08, minFont, maxFont)` where W is the semantic weight (identity=1.0, context=0.7, detail=0.4, action=0.2). Text measured with pretext for vertical fit checks.

## Tech Stack

- **Vite** — bundler
- **React 19** — functional components, hooks, memo
- **@chenglou/pretext** — text measurement without DOM (pure arithmetic)
- **requestAnimationFrame** — all animation (no CSS transitions for weights/hover)
- No UI framework, no state management library

## Development

```bash
npm run dev      # start dev server
npm test         # run vitest
npm run build    # production build
```

## What NOT To Do

- Don't add boolean states (`isExpanded`, `isActive`, etc.) — use continuous weights
- Don't use CSS transitions for hover or weight changes — use the rAF loops
- Don't sort nodes by weight in the treemap — preserve insertion order
- Don't recalculate row plans when container size changes — they're fixed from base weights
- Don't let clicks bubble through already-expanded ancestors
