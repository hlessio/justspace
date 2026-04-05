import { useMemo } from 'react'
import { computeScale } from '../engine/semanticScale.js'
import { measureText, buildFontString } from '../engine/textMeasure.js'

export function SpatialText({ text, layerName, containerWidth, containerHeight, maxHeight }) {
  const scale = useMemo(
    () => computeScale(containerWidth, layerName),
    [containerWidth, layerName]
  )

  const font = buildFontString(scale.fontSize)
  const lineHeight = scale.fontSize * 1.3

  const measurement = useMemo(
    () => measureText(text, font, containerWidth - scale.padding * 2, lineHeight),
    [text, font, containerWidth, scale.padding, lineHeight]
  )

  // Early returns AFTER all hooks
  if (scale.opacity <= 0) return null
  if (containerWidth < 10) return null

  const effectiveMaxHeight = maxHeight ?? containerHeight
  if (measurement.height > effectiveMaxHeight) {
    if (lineHeight > effectiveMaxHeight) return null
  }

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        opacity: scale.opacity,
        fontSize: scale.fontSize,
        lineHeight: `${lineHeight}px`,
        padding: `0 ${scale.padding}px`,
        color: layerName === 'identity' ? '#e8ecf1' : '#8899aa',
        fontWeight: layerName === 'identity' ? 500 : 400,
        overflow: 'hidden',
        whiteSpace: measurement.lineCount > 1 ? 'normal' : 'nowrap',
        textOverflow: 'ellipsis',
        maxHeight: effectiveMaxHeight,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {text}
    </div>
  )
}
