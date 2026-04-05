import { useRef, useCallback, useEffect, useState } from 'react'

const HOVER_WEIGHT = 0.3
const RISE_SPEED = 15
const FALL_SPEED = 2.5
const IDLE_DELAY = 300

export function useHover() {
  const [hoveredId, setHoveredId] = useState(null)
  const [hoverIntensity, setHoverIntensity] = useState(0)
  const intensityRef = useRef(0)
  const targetRef = useRef(0)
  const rafRef = useRef(null)
  const idleTimerRef = useRef(null)
  const lastTimeRef = useRef(null)

  const animate = useCallback(() => {
    const tick = (timestamp) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const dt = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp
      const target = targetRef.current
      const current = intensityRef.current
      const diff = target - current

      if (Math.abs(diff) < 0.005) {
        intensityRef.current = target
        setHoverIntensity(target)
        if (target > 0) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          rafRef.current = null
          lastTimeRef.current = null
        }
        return
      }

      const speed = diff > 0 ? RISE_SPEED : FALL_SPEED
      const remaining = Math.abs(diff)
      const rate = diff < 0
        ? (0.1 + remaining * remaining * 0.9) * speed * dt
        : speed * dt
      intensityRef.current += Math.sign(diff) * Math.min(rate, remaining)
      setHoverIntensity(intensityRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    if (!rafRef.current) {
      lastTimeRef.current = null
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const onNodeEnter = useCallback((nodeId) => {
    setHoveredId(nodeId)
    clearTimeout(idleTimerRef.current)
    targetRef.current = HOVER_WEIGHT
    animate()
  }, [animate])

  const onNodeLeave = useCallback(() => {
    idleTimerRef.current = setTimeout(() => {
      targetRef.current = 0
      animate()
    }, IDLE_DELAY)
  }, [animate])

  const onNodeMove = useCallback((nodeId) => {
    if (nodeId !== hoveredId) {
      setHoveredId(nodeId)
    }
    clearTimeout(idleTimerRef.current)
    targetRef.current = HOVER_WEIGHT
    animate()
  }, [hoveredId, animate])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearTimeout(idleTimerRef.current)
    }
  }, [])

  return { hoveredId, hoverIntensity, onNodeEnter, onNodeLeave, onNodeMove }
}
