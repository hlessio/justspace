import { lazy, Suspense, memo, useMemo } from 'react'

// Lazy icon loader — only imports the icons actually used, not the entire library
const iconCache = new Map()

function getIcon(name) {
  if (!name) return null
  if (iconCache.has(name)) return iconCache.get(name)

  const LazyIcon = lazy(() =>
    import('lucide-react').then(mod => {
      const Icon = mod[name]
      if (!Icon) return { default: () => null }
      return { default: Icon }
    })
  )
  iconCache.set(name, LazyIcon)
  return LazyIcon
}

export const NodeIcon = memo(function NodeIcon({ name, size, color = '#8899aa', opacity = 1 }) {
  const IconComponent = useMemo(() => getIcon(name), [name])
  if (!IconComponent) return null

  return (
    <Suspense fallback={null}>
      <IconComponent
        size={size}
        color={color}
        strokeWidth={1.5}
        style={{ opacity, flexShrink: 0 }}
      />
    </Suspense>
  )
})
