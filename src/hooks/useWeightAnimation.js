import { useRef, useCallback, useSyncExternalStore } from 'react'

const ANIMATION_SPEED = 8
const SETTLE_THRESHOLD = 0.01

export function useWeightAnimation(weightState) {
  const stateRef = useRef(weightState)
  const animatingRef = useRef(false)
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)
  const snapshotRef = useRef(weightState)
  const subscribersRef = useRef(new Set())

  stateRef.current = weightState

  const subscribe = useCallback((callback) => {
    subscribersRef.current.add(callback)
    return () => subscribersRef.current.delete(callback)
  }, [])

  const getSnapshot = useCallback(() => snapshotRef.current, [])

  const notify = useCallback(() => {
    for (const cb of subscribersRef.current) cb()
  }, [])

  const startAnimation = useCallback(() => {
    if (animatingRef.current) return
    animatingRef.current = true
    lastTimeRef.current = null

    const tick = (timestamp) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const dt = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      const state = stateRef.current
      let anyMoving = false
      const nextSnapshot = {}

      for (const [id, s] of Object.entries(state)) {
        const diff = s.target - s.current
        if (Math.abs(diff) < SETTLE_THRESHOLD) {
          s.current = s.target
          nextSnapshot[id] = { ...s }
        } else {
          const remaining = Math.abs(diff)
          const rate = (0.1 + remaining * 0.9) * ANIMATION_SPEED * dt
          s.current += Math.sign(diff) * Math.min(rate, remaining)
          nextSnapshot[id] = { ...s }
          anyMoving = true
        }
      }

      snapshotRef.current = nextSnapshot
      notify()

      if (anyMoving) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        animatingRef.current = false
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [notify])

  const currentState = useSyncExternalStore(subscribe, getSnapshot)

  const needsAnimation = Object.entries(weightState).some(
    ([id, s]) => Math.abs(s.current - s.target) >= SETTLE_THRESHOLD
  )
  if (needsAnimation && !animatingRef.current) {
    startAnimation()
  }

  return currentState
}
