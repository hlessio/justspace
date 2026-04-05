import { useState, useCallback, useRef, useEffect } from 'react'
import {
  pickDirectory,
  readDirectoryAsTree,
  saveNote,
  saveFolderMeta,
  createNoteFile,
  createSubfolder,
  deleteEntry,
} from '../engine/filesystem.js'

const SAVE_DEBOUNCE = 800

export function useFileSystemTree() {
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dirName, setDirName] = useState(null)
  const saveTimers = useRef({})
  const treeRef = useRef(null)
  treeRef.current = tree

  // Open a directory
  const openDirectory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const handle = await pickDirectory()
      const newTree = await readDirectoryAsTree(handle)
      setTree(newTree)
      setDirName(handle.name)
      setLoading(false)
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message)
        console.warn('Failed to open directory:', e)
      }
      setLoading(false)
    }
  }, [])

  // Refresh from disk
  const refresh = useCallback(async () => {
    if (!tree?._handle) return
    setLoading(true)
    const refreshed = await readDirectoryAsTree(tree._handle)
    setTree(refreshed)
    setLoading(false)
  }, [tree])

  // Find node in tree by id
  const findNode = useCallback((nodeId) => {
    function walk(node) {
      if (node.id === nodeId) return node
      for (const child of node.children || []) {
        const found = walk(child)
        if (found) return found
      }
      return null
    }
    return treeRef.current ? walk(treeRef.current) : null
  }, [])

  // Find parent of a node
  const findParent = useCallback((nodeId) => {
    function walk(node) {
      for (const child of node.children || []) {
        if (child.id === nodeId) return node
        const found = walk(child)
        if (found) return found
      }
      return null
    }
    return treeRef.current ? walk(treeRef.current) : null
  }, [])

  // Update text — saves to file system with debounce
  const updateNodeText = useCallback((nodeId, layerName, newText) => {
    setTree(prev => {
      if (!prev) return prev
      const next = cloneTree(prev)
      const node = findInClone(next, nodeId)
      if (!node) return prev

      const layer = node.semanticLayers?.find(l => l.layer === layerName)
      if (layer) layer.text = newText
      if (layerName === 'identity') node.label = newText

      return next
    })

    // Debounced save to file system
    clearTimeout(saveTimers.current[nodeId])
    saveTimers.current[nodeId] = setTimeout(async () => {
      const node = findNode(nodeId)
      if (!node) return
      if (node.type === 'note') {
        await saveNote(node)
      } else if (node.type === 'folder') {
        await saveFolderMeta(node)
      }
    }, SAVE_DEBOUNCE)
  }, [findNode])

  // Add note
  const addNote = useCallback(async (parentId) => {
    const parent = findNode(parentId)
    if (!parent || !parent._handle) return

    const noteNode = await createNoteFile(parent, '')
    if (!noteNode) return

    setTree(prev => {
      if (!prev) return prev
      const next = cloneTree(prev)
      const parentClone = findInClone(next, parentId)
      if (parentClone) {
        parentClone.children.push(noteNode)
      }
      return next
    })
  }, [findNode])

  // Add folder
  const addFolder = useCallback(async (parentId) => {
    const parent = findNode(parentId)
    if (!parent || !parent._handle) return

    const folderNode = await createSubfolder(parent, '')
    if (!folderNode) return

    setTree(prev => {
      if (!prev) return prev
      const next = cloneTree(prev)
      const parentClone = findInClone(next, parentId)
      if (parentClone) {
        parentClone.children.push(folderNode)
      }
      return next
    })
  }, [findNode])

  // Delete node
  const deleteNode = useCallback(async (nodeId) => {
    const node = findNode(nodeId)
    const parent = findParent(nodeId)
    if (!node || !parent) return

    await deleteEntry(node, parent)

    setTree(prev => {
      if (!prev) return prev
      const next = cloneTree(prev)
      removeFromClone(next, nodeId)
      return next
    })
  }, [findNode, findParent])

  return {
    tree,
    loading,
    error,
    dirName,
    openDirectory,
    refresh,
    updateNodeText,
    addNote,
    addFolder,
    deleteNode,
  }
}

// Deep clone preserving _handle refs
function cloneTree(node) {
  return {
    ...node,
    semanticLayers: node.semanticLayers?.map(l => ({ ...l })),
    children: node.children?.map(c => cloneTree(c)) || [],
  }
}

function findInClone(tree, id) {
  if (tree.id === id) return tree
  for (const child of tree.children || []) {
    const found = findInClone(child, id)
    if (found) return found
  }
  return null
}

function removeFromClone(tree, id) {
  if (!tree.children) return
  const idx = tree.children.findIndex(c => c.id === id)
  if (idx !== -1) { tree.children.splice(idx, 1); return }
  for (const child of tree.children) removeFromClone(child, id)
}
