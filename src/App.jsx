import { useState, useEffect, useMemo } from 'react'
import { SpatialNode } from './components/SpatialNode.jsx'
import { squarify, computeRowPlan } from './engine/treemap.js'
import { useTree } from './hooks/useTree.js'
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

  const { tree, updateNodeText, addChild, deleteNode } = useTree()
  const { stateByParent, handleClickNode, handleClickBackground } = useSpatialState(tree)
  const { mousePos, hoverIntensity, onMouseMove } = useHover()

  const containerRect = {
    x: ROOT_PADDING,
    y: ROOT_PADDING,
    width: viewport.width - ROOT_PADDING * 2,
    height: viewport.height - ROOT_PADDING * 2,
  }

  const rowPlan = useMemo(() => {
    if (tree.layout) return tree.layout
    const baseItems = tree.children.map(c => ({ id: c.id, weight: c.baseWeight }))
    return computeRowPlan(baseItems)
  }, [tree.children, tree.layout])

  const rootWeightState = stateByParent[tree.id] || {}
  const baseRects = useMemo(() => {
    const weights = tree.children.map(child => {
      const ws = rootWeightState[child.id]
      return { id: child.id, weight: ws ? ws.current : child.baseWeight }
    })
    return squarify(weights, containerRect, rowPlan)
  }, [rootWeightState, containerRect.width, containerRect.height, rowPlan, tree.children])

  const rects = useMemo(() => {
    if (!mousePos || hoverIntensity <= 0) return baseRects
    const weights = tree.children.map(child => {
      const ws = rootWeightState[child.id]
      const current = ws ? ws.current : child.baseWeight
      const rect = baseRects.find(r => r.id === child.id)
      const hover = rect ? computeHoverWeight(mousePos, hoverIntensity, rect) : 0
      return { id: child.id, weight: current + hover }
    })
    return squarify(weights, containerRect, rowPlan)
  }, [baseRects, mousePos, hoverIntensity, rootWeightState, containerRect.width, containerRect.height, rowPlan, tree.children])

  const nodeMap = useMemo(() => {
    const map = {}
    for (const child of tree.children) map[child.id] = child
    return map
  }, [tree.children])

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
        if (e.target === e.currentTarget) handleClickBackground(tree.id)
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
            parentId={tree.id}
            stateByParent={stateByParent}
            onClickNode={handleClickNode}
            onClickBackground={handleClickBackground}
            mousePos={mousePos}
            hoverIntensity={hoverIntensity}
            onUpdateText={updateNodeText}
            onAddChild={addChild}
            onDeleteNode={deleteNode}
          />
        )
      })}
    </div>
  )
}

export default App
