import { prepare, layout } from '@chenglou/pretext'

const preparedCache = new Map()

function getCacheKey(text, font) {
  return `${font}|||${text}`
}

export function measureText(text, font, maxWidth, lineHeight) {
  const key = getCacheKey(text, font)
  let prepared = preparedCache.get(key)
  if (!prepared) {
    prepared = prepare(text, font)
    preparedCache.set(key, prepared)
  }
  return layout(prepared, maxWidth, lineHeight)
}

export function buildFontString(fontSize, fontWeight = 400) {
  return `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`
}

export function clearMeasureCache() {
  preparedCache.clear()
}
