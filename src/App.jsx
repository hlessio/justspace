import { useState, useEffect, useMemo } from 'react'
import { SpatialNode } from './components/SpatialNode.jsx'
import { squarify, computeRowPlan } from './engine/treemap.js'
import { testTree } from './data/tree.js'
import { useSpatialState } from './hooks/useSpatialState.js'
import { useHover, computeHoverWeight } from './hooks/useHover.js'

const ROOT_PADDING = 8

function App() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { stateByParent, handleClickNode, handleClickBackground } = useSpatialState(testTree)
  const { mousePos, hoverIntensity, onMouseMove } = useHover()

  const containerRect = {
    x: ROOT_PADDING,
    y: ROOT_PADDING,
    width: viewport.width - ROOT_PADDING * 2,
    height: viewport.height - ROOT_PADDING * 2,
  }

  // Row plan: computed ONCE from base weights, never changes
  const rowPlan = useMemo(() => {
    const baseItems = testTree.children.map(c => ({ id: c.id, weight: c.baseWeight }))
    return computeRowPlan(baseItems)
  }, [])

  // Base rects from click weights (no hover) — used for hover distance calc
  const rootWeightState = stateByParent[testTree.id] || {}
  const baseRects = useMemo(() => {
    const weights = testTree.children.map(child => {
      const ws = rootWeightState[child.id]
      return { id: child.id, weight: ws ? ws.current : child.baseWeight }
    })
    return squarify(weights, containerRect, rowPlan)
  }, [rootWeightState, containerRect.width, containerRect.height, rowPlan])

  // Final rects with gaussian hover
  const rects = useMemo(() => {
    if (!mousePos || hoverIntensity <= 0) return baseRects
    const weights = testTree.children.map(child => {
      const ws = rootWeightState[child.id]
      const current = ws ? ws.current : child.baseWeight
      const rect = baseRects.find(r => r.id === child.id)
      const hover = rect ? computeHoverWeight(mousePos, hoverIntensity, rect) : 0
      return { id: child.id, weight: current + hover }
    })
    return squarify(weights, containerRect, rowPlan)
  }, [baseRects, mousePos, hoverIntensity, rootWeightState, containerRect.width, containerRect.height, rowPlan])

  const nodeMap = useMemo(() => {
    const map = {}
    for (const child of testTree.children) map[child.id] = child
    return map
  }, [])

  return (
    <div
      style={{
        width: viewport.width,
        height: viewport.height,
        background: '#0a0a0f',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseMove={onMouseMove}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClickBackground(testTree.id)
      }}
    >
      {rects.map(rect => {
        const node = nodeMap[rect.id]
        if (!node) return null
        return (
          <SpatialNode
            key={rect.id}
            node={node}
            rect={{ x: rect.x, y: rect.y, width: rect.width - 4, height: rect.height - 4 }}
            parentId={testTree.id}
            stateByParent={stateByParent}
            onClickNode={handleClickNode}
            onClickBackground={handleClickBackground}
            mousePos={mousePos}
            hoverIntensity={hoverIntensity}
          />
        )
      })}
    </div>
  )
}

export default App
