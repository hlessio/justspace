import { describe, it, expect } from 'vitest'
import { createWeightState, applyClick, getTargetWeights } from '../weights.js'

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
  it('promotes a node from checkpoint 1 to checkpoint 2', () => {
    const state = createWeightState(['a', 'b', 'c'], { a: 1.0, b: 1.0, c: 1.0 })
    const next = applyClick(state, 'b', { a: 1.0, b: 1.0, c: 1.0 })
    expect(next.b.target).toBe(2)
  })

  it('promotes a node from checkpoint 2 to checkpoint 3', () => {
    const state = createWeightState(['a', 'b'], { a: 1.0, b: 1.0 })
    state.b.target = 2
    state.b.current = 2
    const next = applyClick(state, 'b', { a: 1.0, b: 1.0 })
    expect(next.b.target).toBe(3)
  })

  it('demotes a focused node back to checkpoint 2 when clicking another sibling', () => {
    const state = createWeightState(['a', 'b'], { a: 1.0, b: 1.0 })
    state.a.target = 3
    state.a.current = 3
    const next = applyClick(state, 'b', { a: 1.0, b: 1.0 })
    expect(next.a.target).toBeLessThan(3)
    expect(next.b.target).toBe(2)
  })

  it('demotes all children when clicking background (null)', () => {
    const state = createWeightState(['a', 'b'], { a: 1.0, b: 1.0 })
    state.a.target = 2
    state.a.current = 2
    const next = applyClick(state, null, { a: 1.0, b: 1.0 })
    expect(next.a.target).toBe(1.0)
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
