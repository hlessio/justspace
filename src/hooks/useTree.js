import { useState, useCallback, useEffect, useRef } from 'react'
import { defaultTree } from '../data/defaultTree.js'

const STORAGE_KEY = 'spatial-engine-tree'

// Load tree from localStorage or use default
function loadTree() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    console.warn('Failed to load tree from localStorage:', e)
  }
  return defaultTree
}

// Save tree to localStorage
function saveTree(tree) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree))
  } catch (e) {
    console.warn('Failed to save tree:', e)
  }
}

let idCounter = Date.now()
function generateId() {
  return `node-${idCounter++}`
}

export function useTree() {
  const [tree, setTree] = useState(loadTree)
  const saveTimerRef = useRef(null)

  // Auto-save with debounce
  useEffect(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveTree(tree), 500)
  }, [tree])

  // Update a node's text (for editing)
  const updateNodeText = useCallback((nodeId, layerName, newText) => {
    setTree(prev => {
      const next = cloneTree(prev)
      const node = findNodeInTree(next, nodeId)
      if (!node) return prev
      const layer = node.semanticLayers?.find(l => l.layer === layerName)
      if (layer) {
        layer.text = newText
      }
      // Also update label if identity
      if (layerName === 'identity') {
        node.label = newText
      }
      return next
    })
  }, [])

  // Add a child node
  const addChild = useCallback((parentId) => {
    setTree(prev => {
      const next = cloneTree(prev)
      const parent = findNodeInTree(next, parentId)
      if (!parent) return prev
      if (!parent.children) parent.children = []

      const newNode = {
        id: generateId(),
        label: '',
        icon: 'Circle',
        baseWeight: 0.3,
        semanticLayers: [
          { layer: 'identity', text: '' },
          { layer: 'detail', text: '' },
        ],
        children: [],
      }
      parent.children.push(newNode)
      return next
    })
  }, [])

  // Delete a node
  const deleteNode = useCallback((nodeId) => {
    setTree(prev => {
      const next = cloneTree(prev)
      removeNodeFromTree(next, nodeId)
      return next
    })
  }, [])

  // Reset to default
  const resetTree = useCallback(() => {
    setTree(defaultTree)
  }, [])

  return { tree, updateNodeText, addChild, deleteNode, resetTree }
}

// Deep clone a tree
function cloneTree(node) {
  return {
    ...node,
    semanticLayers: node.semanticLayers?.map(l => ({ ...l })),
    children: node.children?.map(c => cloneTree(c)) || [],
  }
}

function findNodeInTree(tree, id) {
  if (tree.id === id) return tree
  for (const child of tree.children || []) {
    const found = findNodeInTree(child, id)
    if (found) return found
  }
  return null
}

function removeNodeFromTree(tree, id) {
  if (!tree.children) return
  const idx = tree.children.findIndex(c => c.id === id)
  if (idx !== -1) {
    tree.children.splice(idx, 1)
    return
  }
  for (const child of tree.children) {
    removeNodeFromTree(child, id)
  }
}
