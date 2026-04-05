import { useState, useCallback } from 'react'
import { createWeightState, applyClick } from '../engine/weights.js'
import { getBaseWeights } from '../data/tree.js'

export function useSpatialState(tree) {
  const [stateByParent, setStateByParent] = useState(() => {
    return initWeightStates(tree)
  })

  const handleClickNode = useCallback((nodeId, parentId) => {
    setStateByParent(prev => {
      const parentState = prev[parentId]
      if (!parentState) return prev

      const parentNode = findNode(tree, parentId)
      if (!parentNode) return prev

      const baseWeights = getBaseWeights(parentNode.children || parentNode)
      const nextState = applyClick(parentState, nodeId, baseWeights)

      return { ...prev, [parentId]: nextState }
    })
  }, [tree])

  const handleClickBackground = useCallback((parentId) => {
    setStateByParent(prev => {
      const parentState = prev[parentId]
      if (!parentState) return prev

      const parentNode = findNode(tree, parentId)
      if (!parentNode) return prev

      const baseWeights = getBaseWeights(parentNode.children || parentNode)
      const nextState = applyClick(parentState, null, baseWeights)

      return { ...prev, [parentId]: nextState }
    })
  }, [tree])

  return { stateByParent, handleClickNode, handleClickBackground }
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

function findNode(tree, id) {
  if (tree.id === id) return tree
  for (const child of tree.children || []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}
