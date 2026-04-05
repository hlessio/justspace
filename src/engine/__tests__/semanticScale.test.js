import { describe, it, expect } from 'vitest'
import { computeScale, SEMANTIC_LAYERS } from '../semanticScale.js'

describe('computeScale', () => {
  it('returns fontSize, opacity, and padding', () => {
    const result = computeScale(400, 'identity')
    expect(result).toHaveProperty('fontSize')
    expect(result).toHaveProperty('opacity')
    expect(result).toHaveProperty('padding')
  })

  it('identity has higher fontSize than context at same width', () => {
    const identity = computeScale(300, 'identity')
    const context = computeScale(300, 'context')
    expect(identity.fontSize).toBeGreaterThan(context.fontSize)
  })

  it('fontSize increases with containerWidth', () => {
    const small = computeScale(100, 'identity')
    const large = computeScale(500, 'identity')
    expect(large.fontSize).toBeGreaterThan(small.fontSize)
  })

  it('clamps to max fontSize per layer', () => {
    const huge = computeScale(10000, 'identity')
    expect(huge.fontSize).toBeLessThanOrEqual(SEMANTIC_LAYERS.identity.maxFont)
  })

  it('clamps to min fontSize', () => {
    const tiny = computeScale(5, 'detail')
    expect(tiny.fontSize).toBeGreaterThanOrEqual(4)
  })

  it('opacity is 0 when fontSize is below threshold', () => {
    const tiny = computeScale(10, 'detail')
    expect(tiny.opacity).toBe(0)
  })

  it('opacity is 1 when fontSize is well above threshold', () => {
    const large = computeScale(500, 'identity')
    expect(large.opacity).toBe(1)
  })

  it('context layer has threshold ~7px', () => {
    const belowThreshold = computeScale(80, 'context')
    const aboveThreshold = computeScale(200, 'context')
    expect(belowThreshold.opacity).toBe(0)
    expect(aboveThreshold.opacity).toBeGreaterThan(0)
  })
})
