import { useState, useEffect, useMemo } from 'react'
import { SpatialNode } from './components/SpatialNode.jsx'
import { squarify, computeRowPlan } from './engine/treemap.js'
import { useTree } from './hooks/useTree.js'
import { useSpatialState } from './hooks/useSpatialState.js'
import { useHover, computeHoverWeight } from './hooks/useHover.js'
// Notes App — same spatial engine, different tree shape.
// Everything is a node — including search.

const PADDING = 8

const defaultNotesTree = {
  id: 'root',
  label: 'Root',
  baseWeight: 1,
  // Search on top row (full width), folders below
  layout: [['search'], ['f-inbox'], ['f-progetti'], ['f-personale']],
  children: [
    {
      id: 'search', label: 'Search', icon: 'Search', baseWeight: 0.15, type: 'search',
      semanticLayers: [{ layer: 'identity', text: 'Cerca...' }],
      children: [],
    },
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

  const { stateByParent, handleClickNode, handleClickBackground } = useSpatialState(notesTree)
  const { mousePos, hoverIntensity, onMouseMove } = useHover()

  const containerRect = {
    x: PADDING,
    y: PADDING,
    width: viewport.width - PADDING * 2,
    height: viewport.height - PADDING * 2,
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
      {/* Spatial field — everything is a node, including search */}
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
