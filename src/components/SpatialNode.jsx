import { useMemo, useCallback, memo } from 'react'
import { SpatialText } from './SpatialText.jsx'
import { squarify, computeRowPlan } from '../engine/treemap.js'
import { computeHoverWeight } from '../hooks/useHover.js'

const NODE_GAP = 2
const MIN_CHILD_SIZE = 20

export const SpatialNode = memo(function SpatialNode({
  node,
  rect,
  parentId,
  stateByParent,
  onClickNode,
  onClickBackground,
  mousePos,
  hoverIntensity,
  depth = 0,
}) {
  const { x, y, width, height } = rect

  const childWeightState = stateByParent[node.id] || {}

  const headerHeight = Math.min(height * 0.3, 60)
  const childAreaOrigin = { x: x + NODE_GAP, y: y + headerHeight + NODE_GAP }
  const childrenRect = {
    ...childAreaOrigin,
    width: Math.max(0, width - NODE_GAP * 2),
    height: Math.max(0, height - headerHeight - NODE_GAP * 2),
  }

  const hasChildren = node.children && node.children.length > 0
    && childrenRect.width > MIN_CHILD_SIZE
    && childrenRect.height > MIN_CHILD_SIZE

  // Row plan: computed ONCE from base weights — fixed layout structure
  // Independent of container size — never changes when parent resizes
  const rowPlan = useMemo(() => {
    if (!hasChildren) return null
    const baseItems = node.children.map(c => ({ id: c.id, weight: c.baseWeight }))
    return computeRowPlan(baseItems)
  }, [hasChildren, node.children])

  // Base rects from click weights (for hover distance calc)
  const baseChildRects = useMemo(() => {
    if (!hasChildren) return []
    const weights = node.children.map(child => {
      const ws = childWeightState[child.id]
      return { id: child.id, weight: ws ? ws.current : child.baseWeight }
    })
    return squarify(weights, childrenRect, rowPlan)
  }, [hasChildren, node.children, childWeightState, childrenRect.x, childrenRect.y, childrenRect.width, childrenRect.height, rowPlan])

  // Final rects with gaussian hover
  const childRects = useMemo(() => {
    if (!hasChildren) return []
    if (!mousePos || hoverIntensity <= 0) return baseChildRects

    const weights = node.children.map(child => {
      const ws = childWeightState[child.id]
      const current = ws ? ws.current : child.baseWeight
      const baseRect = baseChildRects.find(r => r.id === child.id)
      const hover = baseRect ? computeHoverWeight(mousePos, hoverIntensity, baseRect) : 0
      return { id: child.id, weight: current + hover }
    })
    return squarify(weights, childrenRect, rowPlan)
  }, [hasChildren, baseChildRects, mousePos, hoverIntensity, node.children, childWeightState, childrenRect.x, childrenRect.y, childrenRect.width, childrenRect.height, rowPlan])

  const childNodeMap = useMemo(() => {
    const map = {}
    for (const child of node.children || []) map[child.id] = child
    return map
  }, [node.children])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    onClickNode(node.id, parentId)
  }, [node.id, parentId, onClickNode])

  const handleChildAreaClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation()
      onClickBackground(node.id)
    }
  }, [node.id, onClickBackground])

  const hoverGlow = mousePos ? computeHoverWeight(mousePos, hoverIntensity, rect) : 0
  const bgAlpha = 0.08 + depth * 0.03 + hoverGlow * 0.15
  const borderAlpha = 0.12 + hoverGlow * 0.6

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: Math.max(4, Math.min(12, width * 0.02)),
        background: `rgba(140, 160, 200, ${bgAlpha})`,
        border: `1px solid rgba(140, 180, 255, ${borderAlpha})`,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      <div
        style={{
          width: '100%',
          height: headerHeight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {(node.semanticLayers || []).map(({ layer, text }) => (
          <SpatialText
            key={layer}
            text={text}
            layerName={layer}
            containerWidth={width}
            containerHeight={headerHeight}
            maxHeight={headerHeight / (node.semanticLayers?.length || 1)}
          />
        ))}
      </div>

      {childRects.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: NODE_GAP,
            top: headerHeight + NODE_GAP,
            width: childrenRect.width,
            height: childrenRect.height,
          }}
          onClick={handleChildAreaClick}
        >
          {childRects.map(childRect => {
            const childNode = childNodeMap[childRect.id]
            if (!childNode) return null
            return (
              <SpatialNode
                key={childRect.id}
                node={childNode}
                rect={{
                  x: childRect.x - childAreaOrigin.x,
                  y: childRect.y - childAreaOrigin.y,
                  width: childRect.width - NODE_GAP,
                  height: childRect.height - NODE_GAP,
                }}
                parentId={node.id}
                stateByParent={stateByParent}
                onClickNode={onClickNode}
                onClickBackground={onClickBackground}
                mousePos={mousePos}
                hoverIntensity={hoverIntensity}
                depth={depth + 1}
              />
            )
          })}
        </div>
      )}
    </div>
  )
})
