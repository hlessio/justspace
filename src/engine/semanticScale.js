export const SEMANTIC_LAYERS = {
  identity: { W: 1.0, maxFont: 32, threshold: 0 },
  context:  { W: 0.7, maxFont: 18, threshold: 7 },
  detail:   { W: 0.4, maxFont: 14, threshold: 9.5 },
  action:   { W: 0.2, maxFont: 13, threshold: 11 },
}

const SCALE_FACTOR = 0.08
const MIN_FONT = 4
const TRANSITION_RANGE = 3

export function computeScale(containerWidth, layerName, containerHeight) {
  const layer = SEMANTIC_LAYERS[layerName]
  if (!layer) throw new Error(`Unknown layer: ${layerName}`)

  // Scale with the constraining dimension — font shrinks when node is compressed in either axis
  const effectiveSize = containerHeight != null
    ? Math.min(containerWidth, containerHeight)
    : containerWidth
  const rawFontSize = effectiveSize * layer.W * SCALE_FACTOR
  const fontSize = clamp(rawFontSize, MIN_FONT, layer.maxFont)

  const opacity = layer.threshold === 0
    ? 1
    : clamp((rawFontSize - layer.threshold) / TRANSITION_RANGE, 0, 1)

  const padding = Math.max(0, (fontSize - 8) * 0.5)

  return { fontSize, opacity, padding }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
