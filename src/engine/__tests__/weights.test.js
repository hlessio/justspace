import { describe, it, expect } from 'vitest'
import { createWeightState, applyClick, getTargetWeights, getBaseWeights } from '../weights.js'

describe('createWeightState', () => {
  it('initializes all nodes at baseWeight', () => {
    const state = createWeightState(['a', 'b', 'c'], { a: 0.8, b: 1.0, c: 1.0 })
    expect(state.a.current).toBe(0.8)
    expect(state.b.current).toBe(1.0)
    expect(state.c.current).toBe(1.0)
  })

  it('sets target equal to current initially', () => {
    const state = createWeightState(['a'], { a: 1.0 })
    expect(state.a.target).toBe(state.a.current)
  })
})

describe('applyClick', () => {
  it('boosts clicked node above base', () => {
    const state = createWeightState(['a', 'b', 'c'], { a: 1.0, b: 1.0, c: 1.0 })
    const next = applyClick(state, 'b', { a: 1.0, b: 1.0, c: 1.0 })
    expect(next.b.target).toBeGreaterThan(1.0)
  })

  it('returns siblings to base when one is clicked', () => {
    const state = createWeightState(['a', 'b'], { a: 1.0, b: 1.0 })
    const next = applyClick(state, 'b', { a: 1.0, b: 1.0 })
    expect(next.a.target).toBe(1.0)
    expect(next.b.target).toBeGreaterThan(1.0)
  })

  it('toggles a boosted node back to base', () => {
    const state = createWeightState(['a', 'b'], { a: 1.0, b: 1.0 })
    state.b.target = 5.0 // already boosted
    const next = applyClick(state, 'b', { a: 1.0, b: 1.0 })
    expect(next.b.target).toBe(1.0)
  })

  it('resets all to base when clicking background (null)', () => {
    const state = createWeightState(['a', 'b'], { a: 1.0, b: 1.0 })
    state.a.target = 5.0
    state.a.current = 5.0
    const next = applyClick(state, null, { a: 1.0, b: 1.0 })
    expect(next.a.target).toBe(1.0)
    expect(next.b.target).toBe(1.0)
  })
})

describe('getTargetWeights', () => {
  it('returns target values for treemap layout', () => {
    const state = createWeightState(['a', 'b'], { a: 1.0, b: 1.0 })
    state.a.target = 3
    const weights = getTargetWeights(state)
    expect(weights).toEqual({ a: 3, b: 1.0 })
  })
})

describe('getBaseWeights', () => {
  it('extracts baseWeight map from children array', () => {
    const children = [
      { id: 'a', baseWeight: 0.5 },
      { id: 'b', baseWeight: 1.0 },
    ]
    expect(getBaseWeights(children)).toEqual({ a: 0.5, b: 1.0 })
  })
})
