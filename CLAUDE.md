# Spatial Engine

## What This Is

A UI engine where everything is a continuous weight field. No pages, no discrete states, no modes. Just space, weight, and depth.

The entire app is a single navigable space. Every element is a node in a tree. Every node has a weight. The layout distributes space proportionally to weights. Interaction = perturbing the weight field.

**Weight is everything.** From a single number (weight) derives: layout, typography, visibility, interactivity, editability. There are no separate states for any of these — they all emerge from how much space a node has.

## Core Principles

**Everything is continuous.** There are no `isOpen`, `isExpanded`, `isFocused` booleans anywhere. Nodes have a numeric weight that flows between values. Visual states emerge from the weight distribution.

**The cursor is a field, not a pointer.** Hover applies a gaussian influence — all nodes respond based on their distance from the mouse. No binary hovered/not-hovered.

**Layout is stable.** Row assignments are computed once from base weights (or explicit `layout` arrays) and never change when weights change. Nodes expand/compress within their fixed row.

**Depth amplifies ancestors.** Clicking deeper into the tree progressively gives more weight to ancestors. The deeper you go, the more the root ancestor dominates the screen.

**Descendants reset on exit.** When a node loses focus (sibling takes over), all its descendants reset to base weight. Re-entering is always fresh.

**Editing emerges from weight.** A node becomes editable when its weight exceeds a threshold — no separate editing mode. First click expands, text is immediately editable.

**Search = weight perturbation.** Searching doesn't filter — it gives weight to matching nodes, using the exact same mechanism as a click. The space deforms toward the result.

**Features = nodes.** Adding a feature to the app = adding a node to the tree. The engine handles everything else.

## Architecture

```
src/
  engine/
    treemap.js        — Stable grid: computeRowPlan (once) + squarify (every frame)
    weights.js        — Weight state: applyClick, ensureBoosted (no checkpoints)
    semanticScale.js  — f(S,W): min(width,height) × semantic weight → fontSize/opacity/padding
    textMeasure.js    — pretext wrapper with caching
  components/
    SpatialNode.jsx   — The recursive primitive. Receives rect, renders icon + text + sub-treemap.
    SpatialText.jsx   — Text that scales with f(S,W), opacity from semantic scale.
    NodeIcon.jsx      — Lucide icon renderer, fixed 14px.
  hooks/
    useSpatialState.js — Nested weight management + rAF animation + click bubbling + descendant reset + focusNode API
    useHover.js        — Gaussian hover field: mousePos + hoverIntensity via rAF
    useTree.js         — Dynamic tree with localStorage persistence + CRUD operations
  data/
    defaultTree.js    — Default tree for spatial dashboard (with explicit layout)
  App.jsx             — Spatial dashboard (default view)
  NotesApp.jsx        — Notes app (same engine, different tree + search bar)
  main.jsx            — Hash router: / = spatial, #notes = notes app
```

## Key Design Decisions

### Explicit layout control
Each node can have a `layout` property — an array of rows, each row an array of child ids:
```js
layout: [['inbox', 'progetti'], ['note', 'archivio']]
```
If `layout` is defined, it controls the grid. If not, `computeRowPlan` auto-computes from base weights on a 1×1 square. A `forceAutoLayout` prop overrides explicit layouts.

### Two-phase treemap
1. `computeRowPlan(items)` — row groupings from base weights. Size-independent. Called once.
2. `squarify(items, rect, rowPlan)` — distributes space using current weights within fixed rows. Called every frame.

### Gaussian hover field
Mouse position tracked as `{x, y}` pixels. For each node, hover weight = `BOOST * exp(-distSq * SIGMA) * hoverIntensity`. All nodes get partial influence, smooth crossfade.

### Click bubbling with depth amplification
`handleClickNode` boosts the clicked node, then walks up ancestors with increasing boost: `base + step * depth`. Ancestors that are already boosted get amplified further, not toggled. `ensureBoosted` never toggles — only amplifies.

### Descendant reset
When a node loses focus (a sibling is clicked, or background is clicked), all its descendants' weights reset to base. This ensures re-entering a node shows a clean state.

### Children visibility threshold
Children disappear when the parent is below 100px in either dimension. The parent reclaims all space for its own identity — icon + title centered, clean. Children re-emerge when space is available.

### Font scaling
`fontSize = clamp(min(width, height) * W * 0.08, minFont, maxFont)` — scales with the constraining dimension of the **entire node**, not just the header area.

### Editing from weight
`editing = node.current > node.base + 1.0` — no separate state, no double-click. If the node has enough weight (has been clicked into), its text is editable.

### Search as weight perturbation
`focusNode(id)` applies the same click+bubble logic to a node found by search. Instant — zero debounce. Clearing search resets to base.

## Tech Stack

- **Vite** — bundler
- **React 19** — functional components, hooks, memo
- **@chenglou/pretext** — text measurement without DOM (pure arithmetic)
- **lucide-react** — icons (fixed 14px, always visible)
- **requestAnimationFrame** — all animation (no CSS transitions for weights/hover)
- **localStorage** — tree persistence with debounced auto-save
- No UI framework, no state management library, no router

## Development

```bash
npm run dev      # start dev server (spatial dashboard)
                 # add #notes to URL for notes app
npm test         # run vitest
npm run build    # production build
```

## What NOT To Do

- Don't add boolean states (`isExpanded`, `isActive`, `isEditing`) — derive from weight
- Don't use CSS transitions for hover or weight changes — use the rAF loops
- Don't sort nodes by weight in the treemap — preserve insertion order
- Row plans: currently fixed from base weights on 1×1 square. Open question: auto-recalculating on container resize might produce better adaptive layouts. The rule is: row plan must NOT change from dynamic weights (hover/click), but MAY adapt to viewport shape.
- Don't create separate "modes" (view/edit/compact/expanded) — let them emerge from space
- Don't add navigation (pages, routes, back buttons) — weight redistribution IS navigation
- Don't filter search results — give them weight instead
