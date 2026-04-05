import { useMemo, useCallback } from 'react'
import { SpatialText } from './SpatialText.jsx'
import { squarify } from '../engine/treemap.js'

const NODE_GAP = 2
const MIN_CHILD_SIZE = 20

export function SpatialNode({
  node,
  rect,
  parentId,
  stateByParent,
  onClickNode,
  onClickBackground,
  hoveredId,
  hoverIntensity,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  depth = 0,
}) {
  const { x, y, width, height } = rect

  const childWeightState = stateByParent[node.id] || {}

  const childWeights = useMemo(() => {
    if (!node.children || node.children.length === 0) return []
    return node.children.map(child => {
      const ws = childWeightState[child.id]
      const current = ws ? ws.current : child.baseWeight
      const hover = hoveredId === child.id ? hoverIntensity : 0
      return { id: child.id, weight: current + hover }
    })
  }, [node.children, childWeightState, hoveredId, hoverIntensity])

  const headerHeight = Math.min(height * 0.3, 60)
  const childrenRect = {
    x: x + NODE_GAP,
    y: y + headerHeight + NODE_GAP,
    width: Math.max(0, width - NODE_GAP * 2),
    height: Math.max(0, height - headerHeight - NODE_GAP * 2),
  }

  const showChildren = childWeights.length > 0
    && childrenRect.width > MIN_CHILD_SIZE
    && childrenRect.height > MIN_CHILD_SIZE

  const childRects = useMemo(() => {
    if (!showChildren) return []
    return squarify(childWeights, childrenRect)
  }, [showChildren, childWeights, childrenRect.x, childrenRect.y, childrenRect.width, childrenRect.height])

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

  const bgAlpha = 0.08 + depth * 0.03
  const borderAlpha = hoveredId === node.id ? 0.15 + hoverIntensity * 0.5 : 0.12

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
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={onMouseLeave}
      onMouseMove={() => onMouseMove(node.id)}
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

      {showChildren && (
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
                  x: childRect.x - (x + NODE_GAP),
                  y: childRect.y - (y + headerHeight + NODE_GAP),
                  width: childRect.width - NODE_GAP,
                  height: childRect.height - NODE_GAP,
                }}
                parentId={node.id}
                stateByParent={stateByParent}
                onClickNode={onClickNode}
                onClickBackground={onClickBackground}
                hoveredId={hoveredId}
                hoverIntensity={hoverIntensity}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onMouseMove={onMouseMove}
                depth={depth + 1}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
