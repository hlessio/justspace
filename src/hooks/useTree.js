import { useState, useCallback, useEffect, useRef } from 'react'
import { defaultTree } from '../data/defaultTree.js'

const DEFAULT_STORAGE_KEY = 'spatial-engine-tree'

let idCounter = Date.now()
function generateId() {
  return `node-${idCounter++}`
}

export function useTree({ storageKey = DEFAULT_STORAGE_KEY, defaultTree: customDefault } = {}) {
  const fallbackTree = customDefault || defaultTree

  const [tree, setTree] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to load tree:', e)
    }
    return fallbackTree
  })

  const saveTimerRef = useRef(null)

  // Auto-save with debounce
  useEffect(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(tree)) } catch (e) {}
    }, 500)
  }, [tree, storageKey])

  // Update a node's text
  const updateNodeText = useCallback((nodeId, layerName, newText) => {
    setTree(prev => {
      const next = cloneTree(prev)
      const node = findNodeInTree(next, nodeId)
      if (!node) return prev
      const layer = node.semanticLayers?.find(l => l.layer === layerName)
      if (layer) layer.text = newText
      if (layerName === 'identity') node.label = newText
      return next
    })
  }, [])

  // Add a generic child (backward compat for spatial dashboard)
  const addChild = useCallback((parentId) => {
    setTree(prev => {
      const next = cloneTree(prev)
      const parent = findNodeInTree(next, parentId)
      if (!parent) return prev
      if (!parent.children) parent.children = []
      parent.children.push({
        id: generateId(),
        type: 'folder',
        label: '',
        icon: 'Circle',
        baseWeight: 0.3,
        semanticLayers: [{ layer: 'identity', text: '' }, { layer: 'detail', text: '' }],
        children: [],
      })
      return next
    })
  }, [])

  // Add a folder
  const addFolder = useCallback((parentId) => {
    setTree(prev => {
      const next = cloneTree(prev)
      const parent = findNodeInTree(next, parentId)
      if (!parent) return prev
      if (!parent.children) parent.children = []
      parent.children.push({
        id: generateId(),
        type: 'folder',
        label: '',
        icon: 'Folder',
        baseWeight: 0.4,
        semanticLayers: [{ layer: 'identity', text: '' }],
        children: [],
      })
      return next
    })
  }, [])

  // Add a note
  const addNote = useCallback((parentId) => {
    setTree(prev => {
      const next = cloneTree(prev)
      const parent = findNodeInTree(next, parentId)
      if (!parent) return prev
      if (!parent.children) parent.children = []
      parent.children.push({
        id: generateId(),
        type: 'note',
        label: '',
        icon: 'FileText',
        baseWeight: 0.3,
        semanticLayers: [{ layer: 'identity', text: '' }, { layer: 'detail', text: '' }],
        children: [],
      })
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
    setTree(fallbackTree)
  }, [fallbackTree])

  return { tree, updateNodeText, addChild, addFolder, addNote, deleteNode, resetTree }
}

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
  if (idx !== -1) { tree.children.splice(idx, 1); return }
  for (const child of tree.children) removeNodeFromTree(child, id)
}
