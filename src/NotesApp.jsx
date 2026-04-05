import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { SpatialNode } from './components/SpatialNode.jsx'
import { useTree } from './hooks/useTree.js'
import { useFileSystemTree } from './hooks/useFileSystemTree.js'
import { defaultNotesTree } from './data/defaultNotesTree.js'
import { useSpatialState } from './hooks/useSpatialState.js'
import { useHover } from './hooks/useHover.js'
import { NodeIcon } from './components/NodeIcon.jsx'

const SEARCH_HEIGHT = 52
const PADDING = 8

export default function NotesApp() {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [search, setSearch] = useState('')

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Two modes: file system or localStorage fallback
  const fs = useFileSystemTree()
  const local = useTree({ storageKey: 'spatial-notes-tree', defaultTree: defaultNotesTree })

  const useFS = fs.tree !== null
  const tree = useFS ? fs.tree : local.tree
  const updateNodeText = useFS ? fs.updateNodeText : local.updateNodeText
  const addNote = useFS ? fs.addNote : local.addNote
  const addFolder = useFS ? fs.addFolder : local.addFolder
  const deleteNode = useFS ? fs.deleteNode : local.deleteNode

  const { stateByParent, handleClickNode, handleClickBackground, focusNode } = useSpatialState(tree)
  const { mousePos, hoverIntensity, onMouseMove } = useHover()

  // Search
  const lastSearchRef = useRef('')
  const findMatchingNodes = useCallback((query) => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const matches = []
    const walk = (node) => {
      const texts = (node.semanticLayers || []).map(l => l.text.toLowerCase()).join(' ')
      const label = (node.label || '').toLowerCase()
      if (texts.includes(q) || label.includes(q)) matches.push(node.id)
      for (const child of node.children || []) walk(child)
    }
    walk(tree)
    return matches
  }, [tree])

  useEffect(() => {
    if (!search.trim()) {
      if (lastSearchRef.current) {
        handleClickBackground(tree.id)
        lastSearchRef.current = ''
      }
      return
    }
    const matches = findMatchingNodes(search)
    if (matches.length > 0 && search !== lastSearchRef.current) {
      focusNode(matches[0])
      lastSearchRef.current = search
    }
  }, [search, findMatchingNodes, focusNode, handleClickBackground, tree.id])

  // The root folder IS the spatial field — rendered as a single SpatialNode that fills the viewport
  const rootRect = {
    x: PADDING,
    y: SEARCH_HEIGHT + PADDING,
    width: viewport.width - PADDING * 2,
    height: viewport.height - SEARCH_HEIGHT - PADDING * 2,
  }

  return (
    <div
      style={{
        width: viewport.width,
        height: viewport.height,
        background: '#0a0a0f',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseMove={onMouseMove}
    >
      {/* Search bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: viewport.width, height: SEARCH_HEIGHT,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
        borderBottom: '1px solid rgba(140, 180, 255, 0.08)',
      }}>
        <NodeIcon name="Search" size={16} color="#667788" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#c8d0dc', fontSize: 15, fontFamily: 'inherit' }}
        />

        {/* Open folder / status */}
        <div
          onClick={fs.openDirectory}
          title={useFS ? `${fs.dirName} — clicca per cambiare` : 'Apri cartella'}
          style={{
            padding: '4px 8px', borderRadius: 4, fontSize: 11,
            color: useFS ? '#9aabbf' : '#556677', cursor: 'pointer',
            border: `1px solid rgba(140, 180, 255, ${useFS ? 0.2 : 0.08})`,
            background: useFS ? 'rgba(140, 160, 200, 0.1)' : 'none',
            whiteSpace: 'nowrap', userSelect: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <NodeIcon name={useFS ? 'FolderOpen' : 'FolderInput'} size={12} color={useFS ? '#9aabbf' : '#556677'} />
          {useFS ? fs.dirName : 'Apri cartella'}
        </div>

        {/* Refresh */}
        {useFS && (
          <div
            onClick={fs.refresh}
            title="Ricarica dal disco"
            style={{ cursor: 'pointer', display: 'flex', opacity: 0.5 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
          >
            <NodeIcon name="RefreshCw" size={14} color="#667788" />
          </div>
        )}
      </div>

      {/* Loading */}
      {fs.loading && (
        <div style={{
          position: 'absolute', top: SEARCH_HEIGHT, left: 0, width: '100%',
          padding: '8px 16px', fontSize: 12, color: '#667788',
        }}>
          Caricamento...
        </div>
      )}

      {/* The root folder as a single spatial node — everything inside it */}
      <SpatialNode
        node={tree}
        rect={rootRect}
        parentId={null}
        stateByParent={stateByParent}
        onClickNode={handleClickNode}
        onClickBackground={handleClickBackground}
        mousePos={mousePos}
        hoverIntensity={hoverIntensity}
        onUpdateText={updateNodeText}
        onAddNote={addNote}
        onAddFolder={addFolder}
        onDeleteNode={deleteNode}
      />
    </div>
  )
}
