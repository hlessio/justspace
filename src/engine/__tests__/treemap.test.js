import { describe, it, expect } from 'vitest'
import { squarify } from '../treemap.js'

describe('squarify', () => {
  it('distributes a single node to fill the entire rect', () => {
    const rects = squarify([{ id: 'a', weight: 1 }], { x: 0, y: 0, width: 800, height: 600 })
    expect(rects).toEqual([{ id: 'a', x: 0, y: 0, width: 800, height: 600 }])
  })

  it('distributes two equal nodes into two rects covering the full area', () => {
    const rects = squarify(
      [{ id: 'a', weight: 1 }, { id: 'b', weight: 1 }],
      { x: 0, y: 0, width: 800, height: 600 }
    )
    expect(rects).toHaveLength(2)
    const totalArea = rects.reduce((sum, r) => sum + r.width * r.height, 0)
    expect(totalArea).toBeCloseTo(800 * 600, 0)
    for (const r of rects) {
      expect(r.width * r.height).toBeCloseTo(800 * 600 / 2, -2)
    }
  })

  it('distributes proportionally to weight', () => {
    const rects = squarify(
      [{ id: 'big', weight: 3 }, { id: 'small', weight: 1 }],
      { x: 0, y: 0, width: 400, height: 400 }
    )
    const bigRect = rects.find(r => r.id === 'big')
    const smallRect = rects.find(r => r.id === 'small')
    const bigArea = bigRect.width * bigRect.height
    const smallArea = smallRect.width * smallRect.height
    expect(bigArea / smallArea).toBeCloseTo(3, 0)
  })

  it('handles the 5-node case from our test tree (root children)', () => {
    const rects = squarify(
      [
        { id: 'search', weight: 0.8 },
        { id: 'calendario', weight: 1.0 },
        { id: 'progetti', weight: 1.0 },
        { id: 'documenti', weight: 0.8 },
        { id: 'task', weight: 0.8 },
      ],
      { x: 0, y: 0, width: 1200, height: 800 }
    )
    expect(rects).toHaveLength(5)
    for (const r of rects) {
      const ratio = Math.max(r.width / r.height, r.height / r.width)
      expect(ratio).toBeLessThan(4)
    }
    const totalArea = rects.reduce((sum, r) => sum + r.width * r.height, 0)
    expect(totalArea).toBeCloseTo(1200 * 800, -1)
  })

  it('returns empty array for empty input', () => {
    const rects = squarify([], { x: 0, y: 0, width: 800, height: 600 })
    expect(rects).toEqual([])
  })

  it('respects container offset', () => {
    const rects = squarify([{ id: 'a', weight: 1 }], { x: 100, y: 50, width: 200, height: 200 })
    expect(rects[0].x).toBe(100)
    expect(rects[0].y).toBe(50)
  })
})
