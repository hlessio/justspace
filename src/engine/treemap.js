// Stable Grid Layout
// Two-phase:
//   1. computeRowPlan() — determines row groupings from BASE weights (called once)
//   2. layoutWithPlan() — distributes space using CURRENT weights (called every frame)
// Row assignments NEVER change — nodes expand/compress within their row.

// Phase 1: compute the fixed row plan from base weights
// Uses a normalized square (1×1) so the plan is INDEPENDENT of container size.
export function computeRowPlan(items) {
  if (items.length <= 1) return null // no plan needed for 0-1 items

  const n = items.length
  const refRect = { width: 1, height: 1 } // normalized — size doesn't matter
  let bestRows = [items.map(i => i.id)]
  let bestScore = Infinity

  for (let numRows = 1; numRows <= Math.min(n, 5); numRows++) {
    const groups = splitIntoRows(items, numRows)
    const score = scoreRowLayout(groups, refRect)
    if (score < bestScore) {
      bestScore = score
      bestRows = groups.map(row => row.map(i => i.id))
    }
  }

  return bestRows // array of arrays of ids
}

// Phase 2: layout using current weights but fixed row plan
export function squarify(items, rect, rowPlan) {
  if (items.length === 0) return []
  if (items.length === 1) {
    return [{ id: items[0].id, x: rect.x, y: rect.y, width: rect.width, height: rect.height }]
  }

  // Build weight lookup
  const weightMap = {}
  for (const item of items) weightMap[item.id] = item.weight

  // Use the fixed row plan, or fall back to computing one
  const idRows = rowPlan || computeRowPlan(items, rect) || [items.map(i => i.id)]

  // Compute row heights proportional to total weight in each row
  const rowTotalWeights = idRows.map(ids =>
    ids.reduce((sum, id) => sum + (weightMap[id] || 0.1), 0)
  )
  const totalRowWeight = rowTotalWeights.reduce((s, w) => s + w, 0)
  const rowHeights = rowTotalWeights.map(w =>
    (w / totalRowWeight) * rect.height
  )

  // Lay out each row
  const result = []
  let y = rect.y

  for (let r = 0; r < idRows.length; r++) {
    const ids = idRows[r]
    const rowHeight = rowHeights[r]
    const rowTotalW = rowTotalWeights[r]

    let x = rect.x
    for (const id of ids) {
      const w = ((weightMap[id] || 0.1) / rowTotalW) * rect.width
      result.push({ id, x, y, width: w, height: rowHeight })
      x += w
    }

    y += rowHeight
  }

  return result
}

function splitIntoRows(items, numRows) {
  const n = items.length
  const rows = []
  const perRow = Math.ceil(n / numRows)
  for (let i = 0; i < n; i += perRow) {
    rows.push(items.slice(i, i + perRow))
  }
  return rows
}

function scoreRowLayout(rows, rect) {
  const rowTotalWeights = rows.map(row =>
    row.reduce((sum, item) => sum + item.weight, 0)
  )
  const sumRowWeights = rowTotalWeights.reduce((s, w) => s + w, 0)
  let totalScore = 0
  let count = 0

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const rowHeight = (rowTotalWeights[r] / sumRowWeights) * rect.height
    const rowTotalW = rowTotalWeights[r]

    for (const item of row) {
      const cellWidth = (item.weight / rowTotalW) * rect.width
      const ratio = Math.max(cellWidth / rowHeight, rowHeight / cellWidth)
      totalScore += ratio
      count++
    }
  }

  return totalScore / count
}
