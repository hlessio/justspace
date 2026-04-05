import { useState, useCallback, useEffect, useRef } from 'react'
import { createWeightState, applyClick, ensureBoosted } from '../engine/weights.js'
import { getBaseWeights } from '../data/tree.js'

const ANIMATION_SPEED = 6   // units per second
const SETTLE_THRESHOLD = 0.01

export function useSpatialState(tree) {
  // Build parent map once: nodeId → parentId (for click bubbling)
  const parentMapRef = useRef(buildParentMap(tree))

  const [stateByParent, setStateByParent] = useState(() => {
    return initWeightStates(tree)
  })

  // Single rAF loop — animates all current values toward their targets
  const stateRef = useRef(stateByParent)
  stateRef.current = stateByParent

  useEffect(() => {
    let raf
    let lastTime = Date.now()

    const tick = () => {
      const now = Date.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      const state = stateRef.current
      let anyMoving = false
      let nextState = null

      for (const [parentId, weightState] of Object.entries(state)) {
        for (const [nodeId, s] of Object.entries(weightState)) {
          const diff = s.target - s.current
          if (Math.abs(diff) > SETTLE_THRESHOLD) {
            if (!nextState) nextState = deepCloneState(state)
            const remaining = Math.abs(diff)
            // Ease-in-out: fast in middle, gentle at edges
            const rate = (0.1 + remaining * 0.9) * ANIMATION_SPEED * dt
            nextState[parentId][nodeId].current += Math.sign(diff) * Math.min(rate, remaining)
            anyMoving = true
          }
        }
      }

      if (nextState) {
        stateRef.current = nextState
        setStateByParent(nextState)
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleClickNode = useCallback((nodeId, parentId) => {
    const parentMap = parentMapRef.current

    setStateByParent(prev => {
      let next = { ...prev }

      // 1. Boost the clicked node at its parent level
      const parentState = prev[parentId]
      if (parentState) {
        const parentNode = findNode(tree, parentId)
        if (parentNode) {
          const baseWeights = getBaseWeights(parentNode.children)
          next[parentId] = applyClick(parentState, nodeId, baseWeights)
        }
      }

      // 2. Bubble up: amplify ancestors with increasing boost per depth level.
      //    Deeper clicks = ancestors take more space. Never toggles — only expands.
      const DEPTH_BOOST_BASE = 4.0
      const DEPTH_BOOST_STEP = 4.0 // each level deeper adds this much more — exponential dominance
      let currentId = parentId
      let grandparentId = parentMap[currentId]
      let depthFromClick = 1

      while (grandparentId) {
        const gpState = next[grandparentId]
        if (gpState && gpState[currentId]) {
          const gpNode = findNode(tree, grandparentId)
          if (gpNode) {
            const baseWeights = getBaseWeights(gpNode.children)
            const boost = DEPTH_BOOST_BASE + DEPTH_BOOST_STEP * depthFromClick
            next[grandparentId] = ensureBoosted(gpState, currentId, baseWeights, boost)
          }
        }
        currentId = grandparentId
        grandparentId = parentMap[currentId]
        depthFromClick++
      }

      return next
    })
  }, [tree])

  const handleClickBackground = useCallback((parentId) => {
    setStateByParent(prev => {
      const parentState = prev[parentId]
      if (!parentState) return prev

      const parentNode = findNode(tree, parentId)
      if (!parentNode) return prev

      const baseWeights = getBaseWeights(parentNode.children)
      const nextState = applyClick(parentState, null, baseWeights)

      return { ...prev, [parentId]: nextState }
    })
  }, [tree])

  return { stateByParent, handleClickNode, handleClickBackground }
}

function deepCloneState(state) {
  const clone = {}
  for (const [parentId, weightState] of Object.entries(state)) {
    clone[parentId] = {}
    for (const [nodeId, s] of Object.entries(weightState)) {
      clone[parentId][nodeId] = { ...s }
    }
  }
  return clone
}

function initWeightStates(node) {
  const states = {}
  if (node.children && node.children.length > 0) {
    const ids = node.children.map(c => c.id)
    const baseWeights = getBaseWeights(node.children)
    states[node.id] = createWeightState(ids, baseWeights)

    for (const child of node.children) {
      Object.assign(states, initWeightStates(child))
    }
  }
  return states
}

function buildParentMap(tree) {
  const map = {} // nodeId → parentId
  function walk(node) {
    for (const child of node.children || []) {
      map[child.id] = node.id
      walk(child)
    }
  }
  walk(tree)
  return map
}

function findNode(tree, id) {
  if (tree.id === id) return tree
  for (const child of tree.children || []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}
