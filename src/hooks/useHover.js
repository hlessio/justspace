import { useRef, useCallback, useEffect, useState } from 'react'

// Gaussian hover field — cursor has a continuous area of influence.
// All nodes get hover weight based on distance from cursor.
// Like FisheyeGrid: no binary hovered/not-hovered.

const IDLE_THRESHOLD = 300
const RISE_SPEED = 15
const FALL_SPEED = 2.5
const HOVER_BOOST = 0.5
const HOVER_SIGMA = 0.00004 // controls gaussian spread (smaller = wider influence)

export function useHover() {
  const [mousePos, setMousePos] = useState(null) // { x, y } in viewport pixels
  const [hoverIntensity, setHoverIntensity] = useState(0)
  const intensityRef = useRef(0)
  const lastMoveTime = useRef(0)
  const lastFrameTime = useRef(Date.now())
  const mousePosRef = useRef(null)

  // Single rAF loop
  useEffect(() => {
    let raf
    const tick = () => {
      const now = Date.now()
      const dt = (now - lastFrameTime.current) / 1000
      lastFrameTime.current = now

      const idle = now - lastMoveTime.current > IDLE_THRESHOLD
      const target = idle ? 0 : 1
      const cur = intensityRef.current
      const remaining = Math.abs(target - cur)

      if (remaining > 0.005) {
        let rate
        if (target > cur) {
          rate = RISE_SPEED * dt
        } else {
          rate = (0.1 + remaining * remaining * 0.9) * FALL_SPEED * dt
        }
        const step = Math.sign(target - cur) * Math.min(rate, remaining)
        intensityRef.current = Math.max(0, Math.min(1, cur + step))
        setHoverIntensity(intensityRef.current)
      } else if (cur !== target) {
        intensityRef.current = target
        setHoverIntensity(target)
        if (target === 0) {
          mousePosRef.current = null
          setMousePos(null)
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onMouseMove = useCallback((e) => {
    const pos = { x: e.clientX, y: e.clientY }
    mousePosRef.current = pos
    setMousePos(pos)
    lastMoveTime.current = Date.now()
  }, [])

  return { mousePos, hoverIntensity, onMouseMove }
}

// Compute hover weight for a rect based on distance from mouse
// Returns 0-HOVER_BOOST based on gaussian falloff
export function computeHoverWeight(mousePos, hoverIntensity, rect) {
  if (!mousePos || hoverIntensity <= 0) return 0

  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const dx = mousePos.x - cx
  const dy = mousePos.y - cy
  const distSq = dx * dx + dy * dy

  return HOVER_BOOST * Math.exp(-distSq * HOVER_SIGMA) * hoverIntensity
}
