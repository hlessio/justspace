// Squarified Treemap Algorithm
// Reference: Bruls, Huizing, van Wijk (2000)
// Input: array of { id, weight }, container rect { x, y, width, height }
// Output: array of { id, x, y, width, height }

export function squarify(items, rect) {
  if (items.length === 0) return []
  if (items.length === 1) {
    return [{ id: items[0].id, x: rect.x, y: rect.y, width: rect.width, height: rect.height }]
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight <= 0) return []

  const totalArea = rect.width * rect.height
  const nodes = items
    .map(item => ({ id: item.id, area: (item.weight / totalWeight) * totalArea }))
    .sort((a, b) => b.area - a.area)

  const result = []
  layoutRows(nodes, rect, result)
  return result
}

function layoutRows(nodes, rect, result) {
  if (nodes.length === 0) return

  const { x, y, width, height } = rect
  const isHorizontal = width >= height
  const side = isHorizontal ? width : height

  let row = []
  let rowArea = 0
  let remaining = [...nodes]

  row.push(remaining.shift())
  rowArea = row[0].area

  let bestWorst = worstAspectRatio(row, rowArea, side)

  while (remaining.length > 0) {
    const next = remaining[0]
    const newRowArea = rowArea + next.area
    const newRow = [...row, next]
    const newWorst = worstAspectRatio(newRow, newRowArea, side)

    if (newWorst <= bestWorst) {
      row = newRow
      rowArea = newRowArea
      bestWorst = newWorst
      remaining.shift()
    } else {
      break
    }
  }

  const rowLength = rowArea / side
  let offset = 0

  for (const node of row) {
    const nodeLength = node.area / rowLength

    if (isHorizontal) {
      result.push({ id: node.id, x: x + offset, y, width: nodeLength, height: rowLength })
    } else {
      result.push({ id: node.id, x, y: y + offset, width: rowLength, height: nodeLength })
    }
    offset += nodeLength
  }

  if (remaining.length > 0) {
    const newRect = isHorizontal
      ? { x, y: y + rowLength, width, height: height - rowLength }
      : { x: x + rowLength, y, width: width - rowLength, height }
    layoutRows(remaining, newRect, result)
  }
}

function worstAspectRatio(row, rowArea, side) {
  const rowLength = rowArea / side
  let worst = 0
  for (const node of row) {
    const nodeLength = node.area / rowLength
    const ratio = Math.max(rowLength / nodeLength, nodeLength / rowLength)
    if (ratio > worst) worst = ratio
  }
  return worst
}
