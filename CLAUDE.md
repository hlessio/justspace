# justspace — Spatial Engine

**Live:** https://justspace.vercel.app
**Notes app:** https://justspace.vercel.app/#notes
**Repo:** https://github.com/hlessio/justspace

## What This Is

A UI engine where everything is a continuous weight field. No pages, no discrete states, no modes. Just space, weight, and depth.

The entire app is a single navigable space. Every element is a node in a tree. Every node has a weight. The layout distributes space proportionally to weights. Interaction = perturbing the weight field.

**Weight is everything.** From a single number (weight) derives: layout, typography, visibility, interactivity, editability. There are no separate states for any of these — they all emerge from how much space a node has.

## Core Principles

**Everything is continuous.** No `isOpen`, `isExpanded`, `isFocused` booleans. Nodes have a numeric weight that flows between values. Visual states emerge from the weight distribution.

**The cursor is a field, not a pointer.** Hover applies a gaussian influence — all nodes respond based on their distance from the mouse. No binary hovered/not-hovered.

**Layout is stable.** Row assignments are computed once from base weights (or explicit `layout` arrays) and never change from dynamic weights. Nodes expand/compress within their fixed row.

**Depth amplifies ancestors.** Clicking deeper into the tree progressively gives more weight to ancestors (CLICK_BOOST 8, DEPTH 10+8*n). The deeper you go, the more the root ancestor dominates the screen.

**Descendants reset on exit.** When a node loses focus, all its descendants reset to base weight. Re-entering is always fresh.

**Editing emerges from weight.** A node becomes editable when its weight exceeds a threshold — no separate editing mode.

**Search = weight perturbation.** Searching gives weight to matching nodes using the exact same mechanism as a click. Instant, zero debounce.

**Features = nodes.** Adding a feature = adding a node. The engine handles everything else.

**Subtraction improves the system.** Every time we removed a feature (checkpoints, back button, binary hover, separate editing mode, search filtering), the system got better. When in doubt, remove.

## Architecture

```
src/
  engine/
    treemap.js         — Stable grid: computeRowPlan (once) + squarify (every frame)
    weights.js         — Weight state: applyClick, ensureBoosted, getBaseWeights
    semanticScale.js   — f(S,W): min(width,height) × semantic weight → fontSize/opacity/padding
    textMeasure.js     — @chenglou/pretext wrapper with caching
    filesystem.js      — File System Access API: read/write .md files, YAML frontmatter
  components/
    SpatialNode.jsx    — The recursive primitive. Type-aware (folder vs note).
    SpatialText.jsx    — Text that scales with f(S,W).
    NodeIcon.jsx       — Lazy-loaded Lucide icons, fixed 14px.
  hooks/
    useSpatialState.js — Nested weight management + rAF animation (stops when idle) + click bubbling + descendant reset + focusNode API
    useHover.js        — Gaussian hover field: mousePos + hoverIntensity via rAF (stops when decayed)
    useTree.js         — Dynamic tree with localStorage persistence, parameterized (storageKey + defaultTree)
    useFileSystemTree.js — File system tree: reads directories as spatial trees, saves .md on edit, renames on title change
  data/
    defaultTree.js     — Default spatial dashboard tree
    defaultNotesTree.js — Default notes tree (minimal: Scrivania + welcome note)
  App.jsx              — Spatial dashboard (default view)
  NotesApp.jsx         — Notes app (same engine, file system or localStorage)
  main.jsx             — Hash router: / = spatial, #notes = notes app
  demo-workspace/      — Demo .md files for showcasing
```

## Node Types

**Folders** (`type: 'folder'`): contain children (folders or notes). Render sub-treemap when expanded. Show add buttons (FileText + FolderPlus) and delete (Trash2) when boosted.

**Notes** (`type: 'note'`): contain editable text body. Never render children. Body fills all space below header. Full opacity, min 12-13px font.

Nodes without a `type` field default to folder behavior.

## Key Design Decisions

### Explicit layout control
Each node can have a `layout` property — array of rows, each row an array of child ids. If not defined, `computeRowPlan` auto-computes. `forceAutoLayout` prop overrides explicit layouts.

### Two-phase treemap
1. `computeRowPlan(items)` — row groupings from base weights on 1×1 square. Size-independent.
2. `squarify(items, rect, rowPlan)` — distributes space using current weights within fixed rows.

### Gaussian hover field
Hover weight = `0.5 * exp(-distSq * 0.00004) * hoverIntensity`. rAF loop starts on mouse move, stops when fully decayed.

### Click bubbling with depth amplification
Clicked node gets CLICK_BOOST (8). Ancestors get 10 + 8*depth. `ensureBoosted` never toggles. Descendants of siblings reset on click. Own descendants reset on toggle-close.

### File System Access API
Folders = directories. Notes = .md files. Title from `# heading` or YAML frontmatter `title:`. Body = markdown content. Saves debounced (800ms). Renames file on title edit. Works with Obsidian vaults.

### Performance
- rAF loops stop when settled (zero CPU at rest)
- Children below 8px not mounted (virtualization)
- Children below 100px parent don't render at all
- Lazy icon loading (bundle 348KB vs 830KB)
- Narrow+tall nodes render text vertically (upright characters)

## Tech Stack

- **Vite** — bundler
- **React 19** — functional components, hooks, memo
- **@chenglou/pretext** — text measurement without DOM (pure arithmetic)
- **lucide-react** — icons (lazy loaded)
- **yaml** — frontmatter parsing for .md files
- **requestAnimationFrame** — all animation
- **File System Access API** — local .md file read/write (Chrome/Edge)
- **localStorage** — fallback persistence
- **Vercel** — deployment (auto-deploy from GitHub)

## Development

```bash
npm run dev      # start dev server
                 # / = spatial dashboard
                 # #notes = notes app
npm test         # run vitest
npm run build    # production build
git push         # auto-deploys to Vercel
```

## What NOT To Do

- Don't add boolean states — derive from weight
- Don't use CSS transitions for hover or weight changes — use rAF loops that stop when idle
- Don't sort nodes by weight in the treemap — preserve insertion order
- Don't create separate modes (view/edit/compact/expanded) — let them emerge from space
- Don't add navigation (pages, routes, back buttons) — weight redistribution IS navigation
- Don't filter search results — give them weight instead
- Don't import all icons — lazy load only what's used
- Don't run rAF loops continuously — start on interaction, stop when settled
- Row plans: must NOT change from dynamic weights (hover/click), but MAY adapt to viewport shape (open question)

## What We Learned

1. **Emergence > design.** We never wrote logic for "compact mode" or "expanded mode". These states emerge from weight distribution.
2. **Spatial stability is fundamental.** The moment we fixed row assignments and removed sorting, the interface became navigable.
3. **Continuous beats discrete.** Every time we had a step (checkpoints, binary hover, snap), the system stuttered. Every time we made it continuous, it became organic.
4. **The cursor as a field** is the most original insight. The mouse doesn't select — it deforms space.
5. **Simplicity isn't obvious.** We arrived at it by subtraction — removing checkpoints, Escape, Back, sort, discrete states. Each removal improved the system.
6. **One mechanism, many features.** Click, search, focus, editing, navigation — all are the same operation: perturbing the weight field.

## Future Directions

The spatial engine is a general-purpose layout primitive. Any UI component can be a node:
- **Calendar** — days as weighted nodes, events as children
- **Kanban** — columns as nodes, cards as children
- **File browser** — already done via File System Access API
- **Workspace** — compose any combination of components in one spatial field
- **Drag and drop** — moving nodes between parents = moving files between folders
- **Collaborative** — weight perturbations could be multiplayer
