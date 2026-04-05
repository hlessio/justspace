import { useState, useEffect, useMemo } from 'react'
import { SpatialNode } from './components/SpatialNode.jsx'
import { squarify } from './engine/treemap.js'
import { testTree } from './data/tree.js'
import { useSpatialState } from './hooks/useSpatialState.js'
import { useHover } from './hooks/useHover.js'

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
  const { hoveredId, hoverIntensity, onNodeEnter, onNodeLeave, onNodeMove } = useHover()

  // Root children weights from nested state
  const rootWeightState = stateByParent[testTree.id] || {}
  const effectiveWeights = useMemo(() => {
    return testTree.children.map(child => {
      const ws = rootWeightState[child.id]
      const current = ws ? ws.current : child.baseWeight
      const hover = hoveredId === child.id ? hoverIntensity : 0
      return { id: child.id, weight: current + hover }
    })
  }, [rootWeightState, hoveredId, hoverIntensity])

  const containerRect = {
    x: ROOT_PADDING,
    y: ROOT_PADDING,
    width: viewport.width - ROOT_PADDING * 2,
    height: viewport.height - ROOT_PADDING * 2,
  }

  const rects = useMemo(
    () => squarify(effectiveWeights, containerRect),
    [effectiveWeights, containerRect.width, containerRect.height]
  )

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
            hoveredId={hoveredId}
            hoverIntensity={hoverIntensity}
            onMouseEnter={onNodeEnter}
            onMouseLeave={onNodeLeave}
            onMouseMove={onNodeMove}
          />
        )
      })}
    </div>
  )
}

export default App
