import { useRef, useCallback, useEffect, useState } from 'react'

// Gaussian hover field — cursor has a continuous area of influence.
// rAF only runs when hovering, stops when fully decayed.

const IDLE_THRESHOLD = 300
const RISE_SPEED = 15
const FALL_SPEED = 2.5
const HOVER_BOOST = 0.5
const HOVER_SIGMA = 0.00004

export function useHover() {
  const [mousePos, setMousePos] = useState(null)
  const [hoverIntensity, setHoverIntensity] = useState(0)
  const intensityRef = useRef(0)
  const lastMoveTime = useRef(0)
  const lastFrameTime = useRef(Date.now())
  const rafRef = useRef(null)
  const activeRef = useRef(false)

  const startLoop = useCallback(() => {
    if (activeRef.current) return
    activeRef.current = true
    lastFrameTime.current = Date.now()

    const tick = () => {
      const now = Date.now()
      const dt = (now - lastFrameTime.current) / 1000
      lastFrameTime.current = now

      const idle = now - lastMoveTime.current > IDLE_THRESHOLD
      const target = idle ? 0 : 1
      const cur = intensityRef.current
      const remaining = Math.abs(target - cur)

      if (remaining > 0.005) {
        const rate = target > cur
          ? RISE_SPEED * dt
          : (0.1 + remaining * remaining * 0.9) * FALL_SPEED * dt
        intensityRef.current = Math.max(0, Math.min(1, cur + Math.sign(target - cur) * Math.min(rate, remaining)))
        setHoverIntensity(intensityRef.current)
        rafRef.current = requestAnimationFrame(tick)
      } else if (cur !== target) {
        intensityRef.current = target
        setHoverIntensity(target)
        if (target === 0) {
          setMousePos(null)
          // Fully decayed — stop the loop
          activeRef.current = false
          rafRef.current = null
        } else {
          rafRef.current = requestAnimationFrame(tick)
        }
      } else {
        // Settled — stop
        activeRef.current = false
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const onMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
    lastMoveTime.current = Date.now()
    startLoop()
  }, [startLoop])

  return { mousePos, hoverIntensity, onMouseMove }
}

export function computeHoverWeight(mousePos, hoverIntensity, rect) {
  if (!mousePos || hoverIntensity <= 0) return 0

  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const dx = mousePos.x - cx
  const dy = mousePos.y - cy
  const distSq = dx * dx + dy * dy

  return HOVER_BOOST * Math.exp(-distSq * HOVER_SIGMA) * hoverIntensity
}
