import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { SpatialNode } from './components/SpatialNode.jsx'
import { squarify, computeRowPlan } from './engine/treemap.js'
import { useTree } from './hooks/useTree.js'
import { useSpatialState } from './hooks/useSpatialState.js'
import { useHover, computeHoverWeight } from './hooks/useHover.js'
import { NodeIcon } from './components/NodeIcon.jsx'

// Notes App — same spatial engine, different tree shape.
// Search bar at top, then the spatial field below.

const SEARCH_HEIGHT = 52
const PADDING = 8

const defaultNotesTree = {
  id: 'root',
  label: 'Root',
  baseWeight: 1,
  // Explicit layout: vertical list — each folder is its own row
  layout: [['f-inbox'], ['f-progetti'], ['f-personale']],
  children: [
    {
      id: 'f-inbox', label: 'Inbox', icon: 'Inbox', baseWeight: 0.8,
      // Notes inside also vertical
      layout: [['n1'], ['n7']],
      semanticLayers: [{ layer: 'identity', text: 'Inbox' }, { layer: 'context', text: '2 note' }],
      children: [
        { id: 'n1', label: 'Idea progetto', icon: 'Lightbulb', baseWeight: 0.4,
          semanticLayers: [{ layer: 'identity', text: 'Idea progetto' }, { layer: 'detail', text: 'Esplorare interfaccia spaziale per client presentation. Il layout emerge dalle regole del campo.' }], children: [] },
        { id: 'n7', label: 'Call domani', icon: 'Phone', baseWeight: 0.3,
          semanticLayers: [{ layer: 'identity', text: 'Call domani' }, { layer: 'detail', text: 'Preparare deck, confermare orario con il team.\nPortare esempi del fisheye calendar.' }], children: [] },
      ],
    },
    {
      id: 'f-progetti', label: 'Progetti', icon: 'FolderKanban', baseWeight: 1.0,
      semanticLayers: [{ layer: 'identity', text: 'Progetti' }, { layer: 'context', text: '3 note' }],
      layout: [['n2'], ['n8'], ['n3']],
      children: [
        { id: 'n2', label: 'Brief Bulgari', icon: 'FileText', baseWeight: 0.4,
          semanticLayers: [{ layer: 'identity', text: 'Brief Bulgari' }, { layer: 'detail', text: 'Campagna primavera 2026. Target: giovane, luxury casual.\nDeliverable: 3 video 30s + social kit.' }], children: [] },
        { id: 'n8', label: 'Moodboard Bulgari', icon: 'Image', baseWeight: 0.3,
          semanticLayers: [{ layer: 'identity', text: 'Moodboard Bulgari' }, { layer: 'detail', text: 'Riferimenti: luce naturale, toni caldi, architettura romana contemporanea.\nGuardare lavori di Gregory Crewdson.' }], children: [] },
        { id: 'n3', label: 'Treatment Valentino', icon: 'Film', baseWeight: 0.4,
          semanticLayers: [{ layer: 'identity', text: 'Treatment Valentino' }, { layer: 'detail', text: 'Video istituzionale 2min. Il rosso come filo conduttore tra heritage e futuro.' }], children: [] },
      ],
    },
    {
      id: 'f-personale', label: 'Personale', icon: 'User', baseWeight: 0.8,
      semanticLayers: [{ layer: 'identity', text: 'Personale' }, { layer: 'context', text: '3 note' }],
      layout: [['n4'], ['n5'], ['n6']],
      children: [
        { id: 'n4', label: 'Todo settimana', icon: 'CheckSquare', baseWeight: 0.3,
          semanticLayers: [{ layer: 'identity', text: 'Todo settimana' }, { layer: 'detail', text: 'Revisione moodboard\nStoryboard v2\nCall con regista\nColor grading finale' }], children: [] },
        { id: 'n5', label: 'Riflessioni', icon: 'PenLine', baseWeight: 0.4,
          semanticLayers: [{ layer: 'identity', text: 'Riflessioni' }, { layer: 'detail', text: 'L\'interfaccia spaziale funziona perché elimina il context switch tra navigazione e contenuto.' }], children: [] },
        { id: 'n6', label: 'Riferimenti', icon: 'BookOpen', baseWeight: 0.3,
          semanticLayers: [{ layer: 'identity', text: 'Riferimenti' }, { layer: 'detail', text: 'Bret Victor — Seeing Spaces\nAndy Matuschak — Spatial software\nDynamicland' }], children: [] },
      ],
    },
  ],
}

export default function NotesApp() {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [search, setSearch] = useState('')
  const [autoLayout, setAutoLayout] = useState(false)

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Use the same tree/hooks as the spatial engine
  const { tree, updateNodeText, addChild } = useTree()

  // Override default tree for notes on first load
  const notesTree = useMemo(() => {
    // useTree loads from localStorage — if it has the notes tree, use it
    // Otherwise the defaultTree from useTree is the spatial one, so we use our own
    return tree.children?.[0]?.id === 'f-inbox' ? tree : defaultNotesTree
  }, [tree])

  const { stateByParent, handleClickNode, handleClickBackground, focusNode } = useSpatialState(notesTree)
  const { mousePos, hoverIntensity, onMouseMove } = useHover()

  // Search: find matching nodes and focus the best match
  const searchTimer = useRef(null)
  const lastSearchRef = useRef('')

  const findMatchingNodes = useCallback((query) => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const matches = []
    const walk = (node) => {
      const texts = (node.semanticLayers || []).map(l => l.text.toLowerCase()).join(' ')
      const label = (node.label || '').toLowerCase()
      if (texts.includes(q) || label.includes(q)) {
        matches.push(node.id)
      }
      for (const child of node.children || []) walk(child)
    }
    walk(notesTree)
    return matches
  }, [notesTree])

  useEffect(() => {
    if (!search.trim()) {
      if (lastSearchRef.current) {
        handleClickBackground(notesTree.id)
        lastSearchRef.current = ''
      }
      return
    }
    const matches = findMatchingNodes(search)
    if (matches.length > 0 && search !== lastSearchRef.current) {
      focusNode(matches[0])
      lastSearchRef.current = search
    }
  }, [search, findMatchingNodes, focusNode, handleClickBackground, notesTree.id])

  const containerRect = {
    x: PADDING,
    y: SEARCH_HEIGHT + PADDING,
    width: viewport.width - PADDING * 2,
    height: viewport.height - SEARCH_HEIGHT - PADDING * 2,
  }

  const rowPlan = useMemo(() => {
    if (!autoLayout && notesTree.layout) return notesTree.layout
    const baseItems = notesTree.children.map(c => ({ id: c.id, weight: c.baseWeight }))
    return computeRowPlan(baseItems)
  }, [notesTree.children, notesTree.layout, autoLayout])

  const rootWeightState = stateByParent[notesTree.id] || {}
  const baseRects = useMemo(() => {
    const weights = notesTree.children.map(child => {
      const ws = rootWeightState[child.id]
      return { id: child.id, weight: ws ? ws.current : child.baseWeight }
    })
    return squarify(weights, containerRect, rowPlan)
  }, [rootWeightState, containerRect.width, containerRect.height, rowPlan, notesTree.children])

  const rects = useMemo(() => {
    if (!mousePos || hoverIntensity <= 0) return baseRects
    const weights = notesTree.children.map(child => {
      const ws = rootWeightState[child.id]
      const current = ws ? ws.current : child.baseWeight
      const rect = baseRects.find(r => r.id === child.id)
      const hover = rect ? computeHoverWeight(mousePos, hoverIntensity, rect) : 0
      return { id: child.id, weight: current + hover }
    })
    return squarify(weights, containerRect, rowPlan)
  }, [baseRects, mousePos, hoverIntensity, rootWeightState, containerRect.width, containerRect.height, rowPlan, notesTree.children])

  const nodeMap = useMemo(() => {
    const map = {}
    for (const child of notesTree.children) map[child.id] = child
    return map
  }, [notesTree.children])

  return (
    <div
      style={{
        width: viewport.width,
        height: viewport.height,
        background: '#0a0a0f',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseMove={onMouseMove}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClickBackground(notesTree.id)
      }}
    >
      {/* Search bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: viewport.width, height: SEARCH_HEIGHT,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
        borderBottom: '1px solid rgba(140, 180, 255, 0.08)',
      }}>
        <NodeIcon name="Search" size={16} color="#667788" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#c8d0dc', fontSize: 15, fontFamily: 'inherit' }}
        />
        <div
          onClick={() => setAutoLayout(prev => !prev)}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            color: autoLayout ? '#9aabbf' : '#556677',
            cursor: 'pointer',
            border: `1px solid rgba(140, 180, 255, ${autoLayout ? 0.2 : 0.08})`,
            background: autoLayout ? 'rgba(140, 160, 200, 0.1)' : 'none',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {autoLayout ? 'auto' : 'lista'}
        </div>
      </div>

      {/* Spatial field — same engine */}
      {rects.map(rect => {
        const node = nodeMap[rect.id]
        if (!node) return null
        return (
          <SpatialNode
            key={rect.id}
            node={node}
            rect={{ x: rect.x, y: rect.y, width: rect.width - 4, height: rect.height - 4 }}
            parentId={notesTree.id}
            stateByParent={stateByParent}
            onClickNode={handleClickNode}
            onClickBackground={handleClickBackground}
            mousePos={mousePos}
            hoverIntensity={hoverIntensity}
            onUpdateText={updateNodeText}
            onAddChild={addChild}
            forceAutoLayout={autoLayout}
          />
        )
      })}
    </div>
  )
}
