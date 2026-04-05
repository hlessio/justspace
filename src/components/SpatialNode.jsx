import { useMemo, useCallback, useRef, useEffect, memo } from 'react'
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
  onAddNote,
  onAddFolder,
  onDeleteNode,
  // Legacy compat
  onAddChild,
  forceAutoLayout = false,
  depth = 0,
}) {
  const { x, y, width, height } = rect
  const childWeightState = stateByParent[node.id] || {}
  const hasChildNodes = node.children && node.children.length > 0
  const minDim = Math.min(width, height)
  const isNote = node.type === 'note'

  const identityScale = computeScale(width, 'identity', height)
  const contextScale = computeScale(width, 'context', height)
  const detailScale = computeScale(width, 'detail', height)
  const showIdentityText = identityScale.fontSize >= 6 && minDim > 30
  const showContextText = contextScale.opacity > 0 && minDim > 50
  // Notes show body much earlier — it's the main content
  const showDetail = isNote
    ? height > 50 && width > 60
    : detailScale.opacity > 0 && height > 100 && width > 120
  const showActions = height > 150 && width > 150

  // Notes never show children — they use all space for text body
  const MIN_FOR_CHILDREN = 100
  const childrenWouldFit = !isNote && hasChildNodes && minDim > MIN_FOR_CHILDREN

  // Header
  const textHeight = showIdentityText
    ? identityScale.fontSize * 1.3 + (showContextText ? contextScale.fontSize * 1.3 + 4 : 0)
    : 0
  const headerContentHeight = Math.max(ICON_SIZE + 4, textHeight + 8)

  // Detail area — notes always show body when expanded (even if empty), folders show compact detail
  const detailText = node.semanticLayers?.find(l => l.layer === 'detail')?.text || ''
  const hasDetail = isNote ? showDetail : (detailText && showDetail)
  const detailHeight = isNote && hasDetail
    ? Math.max(0, height - headerContentHeight - 8)
    : hasDetail ? Math.min(height * 0.3, 120) : 0

  let headerHeight
  if (isNote) {
    headerHeight = Math.min(height * 0.3, headerContentHeight)
  } else if (!childrenWouldFit) {
    // Folder without visible children — header stays at top, doesn't fill whole node
    headerHeight = Math.min(height * 0.35, Math.max(24, headerContentHeight))
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

  // Editing: node is editable when boosted
  const ws = stateByParent[parentId]?.[node.id]
  const editing = ws ? ws.current > ws.base + 1.0 : false

  const titleRef = useRef(null)
  const detailRef = useRef(null)
  const prevEditingRef = useRef(false)

  // Set contentEditable text via ref when entering editing mode — prevents React from fighting the cursor
  useEffect(() => {
    if (editing && !prevEditingRef.current) {
      const titleText = node.semanticLayers?.find(l => l.layer === 'identity')?.text || node.label || ''
      const bodyText = node.semanticLayers?.find(l => l.layer === 'detail')?.text || ''
      if (titleRef.current) titleRef.current.textContent = titleText
      // Detail ref might mount slightly after — retry on next frame
      if (detailRef.current) {
        detailRef.current.textContent = bodyText
      } else {
        requestAnimationFrame(() => {
          if (detailRef.current) detailRef.current.textContent = bodyText
        })
      }
    }
    prevEditingRef.current = editing
  }, [editing])

  const handleDetailInput = useCallback((e) => {
    if (onUpdateText) onUpdateText(node.id, 'detail', e.currentTarget.textContent)
  }, [node.id, onUpdateText])

  const handleTitleInput = useCallback((e) => {
    if (onUpdateText) onUpdateText(node.id, 'identity', e.currentTarget.textContent)
  }, [node.id, onUpdateText])

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }, [])

  const handleAddNote = useCallback((e) => {
    e.stopPropagation()
    if (onAddNote) onAddNote(node.id)
    else if (onAddChild) onAddChild(node.id) // legacy fallback
  }, [node.id, onAddNote, onAddChild])

  const handleAddFolder = useCallback((e) => {
    e.stopPropagation()
    if (onAddFolder) onAddFolder(node.id)
  }, [node.id, onAddFolder])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    if (!onDeleteNode) return
    if (hasChildNodes && !window.confirm(`Eliminare "${node.label || 'cartella'}" e tutto il contenuto?`)) return
    onDeleteNode(node.id)
  }, [node.id, node.label, hasChildNodes, onDeleteNode])

  const hoverGlow = mousePos ? computeHoverWeight(mousePos, hoverIntensity, rect) : 0
  const bgAlpha = 0.06 + depth * 0.025 + hoverGlow * 0.12
  const borderAlpha = 0.1 + hoverGlow * 0.5

  // Compact mode: icon + small title centered together. Only truly icon-only below 20px.
  const iconOnly = minDim < 20
  const compact = !iconOnly && minDim < 60

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
      onClick={handleClick}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: (iconOnly || compact) ? 'center' : 'flex-start',
          padding: iconOnly ? 0 : compact ? '2px 4px' : '6px 8px',
          gap: compact ? 4 : 6,
          pointerEvents: iconOnly ? 'none' : 'auto',
          overflow: 'hidden',
        }}
      >
        {node.icon && (
          <NodeIcon
            name={node.icon}
            size={compact ? 11 : ICON_SIZE}
            color={iconOnly ? '#7888a0' : '#9aabbf'}
            opacity={0.8}
          />
        )}

        {/* Compact: show small title next to icon, centered */}
        {compact && !iconOnly && (
          <span style={{
            fontSize: Math.max(8, Math.min(11, minDim * 0.2)),
            color: '#a0aab8',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
          }}>
            {node.semanticLayers?.find(l => l.layer === 'identity')?.text || node.label}
          </span>
        )}

        {!iconOnly && !compact && (
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
                onKeyDown={handleTitleKeyDown}
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
              />
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

        {/* Action buttons — only on folders, when node is large enough */}
        {showActions && !isNote && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
            {(onAddNote || onAddChild) && (
              <div
                onClick={handleAddNote}
                title="Nuova nota"
                style={{ cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.15s', display: 'flex' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
              >
                <NodeIcon name="FileText" size={14} color="#667788" />
              </div>
            )}
            {onAddFolder && (
              <div
                onClick={handleAddFolder}
                title="Nuova cartella"
                style={{ cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.15s', display: 'flex' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
              >
                <NodeIcon name="FolderPlus" size={14} color="#667788" />
              </div>
            )}
          </div>
        )}

        {/* Delete button — appears when editing (node is boosted) */}
        {editing && showActions && onDeleteNode && (
          <div
            onClick={handleDelete}
            title="Elimina"
            style={{ cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s', display: 'flex', flexShrink: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.3}
          >
            <NodeIcon name="Trash2" size={13} color="#887766" />
          </div>
        )}
      </div>

      {/* Detail/body area — notes get full opacity and readable font */}
      {hasDetail && editing && (
        <div
          ref={detailRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleDetailInput}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: 8,
            top: detailTop + 2,
            width: width - 16,
            height: detailHeight - 4,
            fontSize: isNote ? Math.max(13, detailScale.fontSize) : detailScale.fontSize,
            lineHeight: isNote ? '1.6' : `${detailScale.fontSize * 1.5}px`,
            color: isNote ? '#b0bcc8' : '#8899aa',
            opacity: isNote ? 1 : detailScale.opacity,
            padding: '4px 0',
            outline: 'none',
            cursor: 'text',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      )}
      {hasDetail && !editing && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: detailTop + 2,
            width: width - 16,
            height: detailHeight - 4,
            fontSize: isNote ? Math.max(12, detailScale.fontSize) : detailScale.fontSize,
            lineHeight: isNote ? '1.6' : `${detailScale.fontSize * 1.5}px`,
            color: isNote ? '#99a8b8' : '#8899aa',
            opacity: isNote ? 0.9 : detailScale.opacity,
            padding: '4px 0',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            pointerEvents: 'none',
          }}
        >
          {detailText}
        </div>
      )}

      {/* Children treemap — folders only */}
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
            // Virtualization: skip nodes too small to see or interact with
            const cw = childRect.width - NODE_GAP
            const ch = childRect.height - NODE_GAP
            if (cw < 8 || ch < 8) return null

            const childNode = childNodeMap[childRect.id]
            if (!childNode) return null
            return (
              <SpatialNode
                key={childRect.id}
                node={childNode}
                rect={{
                  x: childRect.x - childAreaOrigin.x,
                  y: childRect.y - childAreaOrigin.y,
                  width: cw,
                  height: ch,
                }}
                parentId={node.id}
                stateByParent={stateByParent}
                onClickNode={onClickNode}
                onClickBackground={onClickBackground}
                mousePos={mousePos}
                hoverIntensity={hoverIntensity}
                onUpdateText={onUpdateText}
                onAddNote={onAddNote}
                onAddFolder={onAddFolder}
                onAddChild={onAddChild}
                onDeleteNode={onDeleteNode}
                forceAutoLayout={forceAutoLayout}
                depth={depth + 1}
              />
            )
          })}
        </div>
      )}
    </div>
  )
})
