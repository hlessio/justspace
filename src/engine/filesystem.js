import YAML from 'yaml'

// File System Access API bridge
// Reads a directory into a spatial tree, writes changes back as .md files
// Folders = directories, Notes = .md files
// Metadata (icon, weight, layout) lives in YAML frontmatter
// Title = filename, Body = .md content

const DEFAULT_NOTE_WEIGHT = 0.3
const DEFAULT_FOLDER_WEIGHT = 0.8
const FOLDER_META_FILE = '.folder.md'

// ─── Pick directory ───────────────────────────────────────

export async function pickDirectory() {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
  return handle
}

// ─── Read directory → spatial tree ────────────────────────

export async function readDirectoryAsTree(dirHandle, id = 'root', depth = 0) {
  const folderMeta = await readFolderMeta(dirHandle)

  const node = {
    id,
    type: 'folder',
    label: folderMeta.label || dirHandle.name,
    icon: folderMeta.icon || (depth === 0 ? 'Laptop' : 'Folder'),
    baseWeight: folderMeta.weight || (depth === 0 ? 1.0 : DEFAULT_FOLDER_WEIGHT),
    semanticLayers: [
      { layer: 'identity', text: folderMeta.label || dirHandle.name },
    ],
    layout: folderMeta.layout || undefined,
    children: [],
    _handle: dirHandle,
  }

  const entries = []
  for await (const entry of dirHandle.values()) {
    entries.push(entry)
  }

  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    if (entry.kind === 'directory') {
      const childId = `${id}/${entry.name}`
      const childNode = await readDirectoryAsTree(entry, childId, depth + 1)
      node.children.push(childNode)
    } else if (entry.kind === 'file' && entry.name.endsWith('.md')) {
      const childId = `${id}/${entry.name}`
      const noteNode = await readFileAsNote(entry, childId)
      node.children.push(noteNode)
    }
  }

  const noteCount = node.children.filter(c => c.type === 'note').length
  const folderCount = node.children.filter(c => c.type === 'folder').length
  const parts = []
  if (folderCount > 0) parts.push(`${folderCount} cartelle`)
  if (noteCount > 0) parts.push(`${noteCount} note`)
  if (parts.length > 0) {
    node.semanticLayers.push({ layer: 'context', text: parts.join(', ') })
  }

  return node
}

async function readFileAsNote(fileHandle, id) {
  const file = await fileHandle.getFile()
  const content = await file.text()
  const { frontmatter, body } = parseFrontmatter(content)

  // Title comes from frontmatter, or filename without .md
  const title = frontmatter.title || fileHandle.name.replace(/\.md$/, '')

  return {
    id,
    type: 'note',
    label: title,
    icon: frontmatter.icon || 'FileText',
    baseWeight: frontmatter.weight || DEFAULT_NOTE_WEIGHT,
    semanticLayers: [
      { layer: 'identity', text: title },
      { layer: 'detail', text: body.trim() },
    ],
    children: [],
    _handle: fileHandle,
    _fileName: fileHandle.name,
  }
}

async function readFolderMeta(dirHandle) {
  try {
    const metaHandle = await dirHandle.getFileHandle(FOLDER_META_FILE)
    const file = await metaHandle.getFile()
    const content = await file.text()
    const { frontmatter } = parseFrontmatter(content)
    return frontmatter
  } catch {
    return {}
  }
}

// ─── Write operations ─────────────────────────────────────

export async function saveNote(node) {
  if (!node._handle) return
  const title = node.semanticLayers?.find(l => l.layer === 'identity')?.text || node.label
  const body = node.semanticLayers?.find(l => l.layer === 'detail')?.text || ''

  const frontmatter = { title }
  if (node.icon && node.icon !== 'FileText') frontmatter.icon = node.icon
  if (node.baseWeight !== DEFAULT_NOTE_WEIGHT) frontmatter.weight = node.baseWeight

  const content = serializeFrontmatter(frontmatter, body)
  const writable = await node._handle.createWritable()
  await writable.write(content)
  await writable.close()
}

// Rename a note file on disk when title changes.
// Creates new file, copies content, deletes old. Returns updated node fields.
export async function renameNoteFile(node, parentHandle, newTitle) {
  if (!node._handle || !parentHandle) return null

  const newFileName = sanitizeFileName(newTitle || '') + '.md'
  const oldFileName = node._fileName

  // Skip if name hasn't changed
  if (newFileName === oldFileName) return null

  // Read current content
  const file = await node._handle.getFile()
  const content = await file.text()

  // Create new file with new name
  const newHandle = await parentHandle.getFileHandle(newFileName, { create: true })
  const writable = await newHandle.createWritable()
  await writable.write(content)
  await writable.close()

  // Delete old file
  try {
    await parentHandle.removeEntry(oldFileName)
  } catch (e) {
    console.warn('Failed to delete old file during rename:', e)
  }

  return {
    _handle: newHandle,
    _fileName: newFileName,
  }
}

export async function saveFolderMeta(node) {
  if (!node._handle) return
  const frontmatter = {}
  if (node.label && node.label !== node._handle.name) frontmatter.label = node.label
  if (node.icon && node.icon !== 'Folder') frontmatter.icon = node.icon
  if (node.baseWeight !== DEFAULT_FOLDER_WEIGHT) frontmatter.weight = node.baseWeight
  if (node.layout) frontmatter.layout = node.layout

  if (Object.keys(frontmatter).length === 0) return

  const content = serializeFrontmatter(frontmatter, '')
  const metaHandle = await node._handle.getFileHandle(FOLDER_META_FILE, { create: true })
  const writable = await metaHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function createNoteFile(parentNode, title) {
  if (!parentNode._handle) return null

  // Unique filename: use title if provided, otherwise timestamp-based
  const displayTitle = title || ''
  const fileName = (title ? sanitizeFileName(title) : `nota-${Date.now()}`) + '.md'

  const fileHandle = await parentNode._handle.getFileHandle(fileName, { create: true })

  const frontmatter = {}
  if (displayTitle) frontmatter.title = displayTitle

  const content = serializeFrontmatter(frontmatter, '')
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()

  return {
    id: `${parentNode.id}/${fileName}`,
    type: 'note',
    label: displayTitle,
    icon: 'FileText',
    baseWeight: DEFAULT_NOTE_WEIGHT,
    semanticLayers: [
      { layer: 'identity', text: displayTitle },
      { layer: 'detail', text: '' },
    ],
    children: [],
    _handle: fileHandle,
    _fileName: fileName,
  }
}

export async function createSubfolder(parentNode, name) {
  if (!parentNode._handle) return null

  const displayName = name || ''
  const dirName = name ? sanitizeFileName(name) : `cartella-${Date.now()}`

  const dirHandle = await parentNode._handle.getDirectoryHandle(dirName, { create: true })

  return {
    id: `${parentNode.id}/${dirName}`,
    type: 'folder',
    label: displayName,
    icon: 'Folder',
    baseWeight: DEFAULT_FOLDER_WEIGHT,
    semanticLayers: [
      { layer: 'identity', text: displayName },
    ],
    children: [],
    _handle: dirHandle,
  }
}

export async function deleteEntry(node, parentNode) {
  if (!parentNode._handle) return
  try {
    if (node.type === 'note' && node._fileName) {
      await parentNode._handle.removeEntry(node._fileName)
    } else if (node.type === 'folder') {
      const dirName = node._handle?.name || node.label
      await parentNode._handle.removeEntry(dirName, { recursive: true })
    }
  } catch (e) {
    console.warn('Failed to delete:', e)
  }
}

// ─── Frontmatter parsing ──────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: content }
  try {
    const frontmatter = YAML.parse(match[1]) || {}
    return { frontmatter, body: match[2] }
  } catch {
    return { frontmatter: {}, body: content }
  }
}

function serializeFrontmatter(frontmatter, body) {
  const yaml = YAML.stringify(frontmatter).trim()
  if (body) return `---\n${yaml}\n---\n${body}`
  return `---\n${yaml}\n---\n`
}

function sanitizeFileName(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 100) || `untitled-${Date.now()}`
}
