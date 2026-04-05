import { icons } from 'lucide-react'

// Renders a Lucide icon by name, with size adapted to container
export function NodeIcon({ name, size, color = '#8899aa', opacity = 1 }) {
  const IconComponent = icons[name]
  if (!IconComponent) return null

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={1.5}
      style={{ opacity, flexShrink: 0 }}
    />
  )
}
