import { useMemo, useCallback, useRef, useState, memo } from 'react'
import { SpatialText } from './SpatialText.jsx'
import { NodeIcon } from './NodeIcon.jsx'
import { squarify, computeRowPlan } from '../engine/treemap.js'
import { computeHoverWeight } from '../hooks/useHover.js'
import { computeScale } from '../engine/semanticScale.js'

const NODE_GAP = 2
const MIN_CHILD_SIZE = 20
const ICON_SIZE = 14

export const SpatialNode = memo(function SpatialNode({
  node,
  rect,
  parentId,
  stateByParent,
  onClickNode,
  onClickBackground,
  mousePos,
  hoverIntensity,
  onUpdateText,
  onAddChild,
  onDeleteNode,
  forceAutoLayout = false,
  depth = 0,
}) {
  const { x, y, width, height } = rect
  const childWeightState = stateByParent[node.id] || {}
  const hasChildNodes = node.children && node.children.length > 0
  const minDim = Math.min(width, height)

  const identityScale = computeScale(width, 'identity', height)
  const contextScale = computeScale(width, 'context', height)
  const detailScale = computeScale(width, 'detail', height)
  const showIdentityText = identityScale.fontSize >= 6 && minDim > 30
  const showContextText = contextScale.opacity > 0 && minDim > 50
  const showDetail = detailScale.opacity > 0 && height > 100 && width > 120
  const showActions = height > 150 && width > 150 // "+ add" button, etc.

  // Decide if children have enough space to be visible
  // Children disappear below threshold — parent reclaims all space for its own content
  const MIN_FOR_CHILDREN = 100
  const childrenWouldFit = hasChildNodes && minDim > MIN_FOR_CHILDREN

  // Header adapts
  const textHeight = showIdentityText
    ? identityScale.fontSize * 1.3 + (showContextText ? contextScale.fontSize * 1.3 + 4 : 0)
    : 0
  const headerContentHeight = Math.max(ICON_SIZE + 4, textHeight + 8)

  // Detail area
  const detailText = node.semanticLayers?.find(l => l.layer === 'detail')?.text || ''
  const hasDetail = detailText && showDetail
  const detailHeight = hasDetail ? Math.min(height * 0.3, 120) : 0

  let headerHeight
  if (!childrenWouldFit) {
    // No visible children — header + detail fill everything
    headerHeight = hasDetail ? Math.min(height * 0.35, headerContentHeight) : height
  } else {
    headerHeight = Math.min(height * 0.25, Math.max(24, headerContentHeight))
  }

  const detailTop = headerHeight
  const childrenTop = headerHeight + detailHeight

  const childAreaOrigin = { x: x + NODE_GAP, y: y + childrenTop + NODE_GAP }
  const childrenRect = {
    ...childAreaOrigin,
    width: Math.max(0, width - NODE_GAP * 2),
    height: Math.max(0, height - childrenTop - NODE_GAP * 2),
  }

  const canShowChildren = childrenWouldFit
    && childrenRect.width > MIN_CHILD_SIZE
    && childrenRect.height > MIN_CHILD_SIZE

  // Layout: use node.layout if defined (user-arranged), unless forceAutoLayout
  const rowPlan = useMemo(() => {
    if (!canShowChildren) return null
    if (!forceAutoLayout && node.layout) return node.layout
    const baseItems = node.children.map(c => ({ id: c.id, weight: c.baseWeight }))
    return computeRowPlan(baseItems)
  }, [canShowChildren, node.children, node.layout, forceAutoLayout])

  const baseChildRects = useMemo(() => {
    if (!canShowChildren) return []
    const weights = node.children.map(child => {
      const ws = childWeightState[child.id]
      return { id: child.id, weight: ws ? ws.current : child.baseWeight }
    })
    return squarify(weights, childrenRect, rowPlan)
  }, [canShowChildren, node.children, childWeightState, childrenRect.x, childrenRect.y, childrenRect.width, childrenRect.height, rowPlan])

  const childRects = useMemo(() => {
    if (!canShowChildren) return []
    if (!mousePos || hoverIntensity <= 0) return baseChildRects
    const weights = node.children.map(child => {
      const ws = childWeightState[child.id]
      const current = ws ? ws.current : child.baseWeight
      const baseRect = baseChildRects.find(r => r.id === child.id)
      const hover = baseRect ? computeHoverWeight(mousePos, hoverIntensity, baseRect) : 0
      return { id: child.id, weight: current + hover }
    })
    return squarify(weights, childrenRect, rowPlan)
  }, [canShowChildren, baseChildRects, mousePos, hoverIntensity, node.children, childWeightState, childrenRect.x, childrenRect.y, childrenRect.width, childrenRect.height, rowPlan])

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

  // Editing: the node is editable when it's boosted (user has clicked into it)
  const ws = stateByParent[parentId]?.[node.id]
  const editing = ws ? ws.current > ws.base + 1.0 : false

  const titleRef = useRef(null)
  const detailRef = useRef(null)

  const handleDetailInput = useCallback((e) => {
    if (onUpdateText) onUpdateText(node.id, 'detail', e.currentTarget.textContent)
  }, [node.id, onUpdateText])

  const handleTitleInput = useCallback((e) => {
    if (onUpdateText) onUpdateText(node.id, 'identity', e.currentTarget.textContent)
  }, [node.id, onUpdateText])

  const handleAddChild = useCallback((e) => {
    e.stopPropagation()
    if (onAddChild) onAddChild(node.id)
  }, [node.id, onAddChild])

  const hoverGlow = mousePos ? computeHoverWeight(mousePos, hoverIntensity, rect) : 0
  const bgAlpha = 0.06 + depth * 0.025 + hoverGlow * 0.12
  const borderAlpha = 0.1 + hoverGlow * 0.5

  const iconOnly = minDim < 30 || !showIdentityText

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: Math.max(4, Math.min(12, minDim * 0.06)),
        background: `rgba(140, 160, 200, ${bgAlpha})`,
        border: `1px solid rgba(140, 180, 255, ${borderAlpha})`,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={node.type === 'search' ? undefined : handleClick}
    >
      {/* Search node — special rendering */}
      {node.type === 'search' ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <NodeIcon name="Search" size={ICON_SIZE} color="#667788" opacity={0.7} />
          {height > 20 && (
            <input
              type="text"
              placeholder="Cerca..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#c8d0dc',
                fontSize: Math.max(11, Math.min(identityScale.fontSize, 15)),
                fontFamily: 'inherit',
                padding: 0,
              }}
            />
          )}
        </div>
      ) : (
      <>
      {/* Header */}
      <div
        style={{
          width: '100%',
          height: headerHeight,
          display: 'flex',
          alignItems: iconOnly ? 'center' : 'flex-start',
          justifyContent: iconOnly ? 'center' : 'flex-start',
          padding: iconOnly ? 0 : '6px 8px',
          gap: 6,
          pointerEvents: iconOnly ? 'none' : 'auto',
          overflow: 'hidden',
        }}
      >
        {node.icon && (
          <NodeIcon
            name={node.icon}
            size={ICON_SIZE}
            color={iconOnly ? '#7888a0' : '#9aabbf'}
            opacity={0.8}
          />
        )}

        {!iconOnly && (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 1,
              overflow: 'hidden',
            }}
          >
            {showIdentityText && editing ? (
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleTitleInput}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: identityScale.fontSize,
                  lineHeight: `${identityScale.fontSize * 1.3}px`,
                  color: '#e8ecf1',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'text',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {node.semanticLayers?.find(l => l.layer === 'identity')?.text || node.label}
              </div>
            ) : showIdentityText ? (
              <SpatialText
                text={node.semanticLayers?.find(l => l.layer === 'identity')?.text || node.label}
                layerName="identity"
                containerWidth={width}
                containerHeight={height}
                maxHeight={identityScale.fontSize * 1.5}
                align="left"
              />
            ) : null}
            {showContextText && (
              <SpatialText
                text={node.semanticLayers?.find(l => l.layer === 'context')?.text || ''}
                layerName="context"
                containerWidth={width}
                containerHeight={height}
                maxHeight={contextScale.fontSize * 1.5}
                align="left"
              />
            )}
          </div>
        )}

        {/* Add child button — emerges when node is large */}
        {showActions && onAddChild && (
          <div
            onClick={handleAddChild}
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#667788',
              fontSize: 16,
              cursor: 'pointer',
              flexShrink: 0,
              opacity: 0.5,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
          >
            +
          </div>
        )}
      </div>

      {/* Detail area — editable only in editing mode */}
      {hasDetail && (
        <div
          ref={detailRef}
          contentEditable={editing}
          suppressContentEditableWarning
          onInput={handleDetailInput}
          onClick={(e) => { if (editing) e.stopPropagation() }}
          style={{
            position: 'absolute',
            left: 8,
            top: detailTop + 2,
            width: width - 16,
            height: detailHeight - 4,
            fontSize: detailScale.fontSize,
            lineHeight: `${detailScale.fontSize * 1.5}px`,
            color: '#8899aa',
            opacity: detailScale.opacity,
            padding: '4px 0',
            outline: 'none',
            cursor: editing ? 'text' : 'pointer',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {detailText}
        </div>
      )}

      {/* Children treemap */}
      {childRects.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: NODE_GAP,
            top: childrenTop + NODE_GAP,
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
                onUpdateText={onUpdateText}
                onAddChild={onAddChild}
                onDeleteNode={onDeleteNode}
                forceAutoLayout={forceAutoLayout}
                depth={depth + 1}
              />
            )
          })}
        </div>
      )}
      </>
      )}
    </div>
  )
})
