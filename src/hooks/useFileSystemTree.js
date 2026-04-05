import { useState, useCallback, useRef } from 'react'
import {
  pickDirectory,
  readDirectoryAsTree,
  saveNote,
  saveFolderMeta,
  renameNoteFile,
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
  const creatingRef = useRef(false) // lock for concurrent creation
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
  // When title (identity) changes on a note, also renames the file
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

      try {
        if (node.type === 'note') {
          // Save content first
          await saveNote(node)

          // If title changed, rename the file
          if (layerName === 'identity' && newText) {
            const parent = findParent(nodeId)
            if (parent?._handle) {
              const result = await renameNoteFile(node, parent._handle, newText)
              if (result) {
                // Update the node's handle and fileName in the tree
                setTree(prev => {
                  if (!prev) return prev
                  const next = cloneTree(prev)
                  const n = findInClone(next, nodeId)
                  if (n) {
                    n._handle = result._handle
                    n._fileName = result._fileName
                  }
                  return next
                })
              }
            }
          }
        } else if (node.type === 'folder') {
          await saveFolderMeta(node)
        }
      } catch (e) {
        console.warn('Failed to save:', e)
      }
    }, SAVE_DEBOUNCE)
  }, [findNode, findParent])

  // Add note — with creation lock
  const addNote = useCallback(async (parentId) => {
    if (creatingRef.current) return
    creatingRef.current = true

    try {
      const parent = findNode(parentId)
      if (!parent?._handle) return

      const noteNode = await createNoteFile(parent, '')
      if (!noteNode) return

      setTree(prev => {
        if (!prev) return prev
        const next = cloneTree(prev)
        const parentClone = findInClone(next, parentId)
        if (parentClone) parentClone.children.push(noteNode)
        return next
      })
    } catch (e) {
      console.warn('Failed to create note:', e)
    } finally {
      creatingRef.current = false
    }
  }, [findNode])

  // Add folder — with creation lock
  const addFolder = useCallback(async (parentId) => {
    if (creatingRef.current) return
    creatingRef.current = true

    try {
      const parent = findNode(parentId)
      if (!parent?._handle) return

      const folderNode = await createSubfolder(parent, '')
      if (!folderNode) return

      setTree(prev => {
        if (!prev) return prev
        const next = cloneTree(prev)
        const parentClone = findInClone(next, parentId)
        if (parentClone) parentClone.children.push(folderNode)
        return next
      })
    } catch (e) {
      console.warn('Failed to create folder:', e)
    } finally {
      creatingRef.current = false
    }
  }, [findNode])

  // Delete node
  const deleteNode = useCallback(async (nodeId) => {
    const node = findNode(nodeId)
    const parent = findParent(nodeId)
    if (!node || !parent) return

    try {
      await deleteEntry(node, parent)
    } catch (e) {
      console.warn('Failed to delete from disk:', e)
    }

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

// Deep clone — explicitly preserves _handle, _fileName, type
function cloneTree(node) {
  return {
    ...node,
    _handle: node._handle,
    _fileName: node._fileName,
    type: node.type,
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
