// Weight state — fully continuous, no discrete checkpoints.
// Click = boost the clicked node, siblings return to base.
// Everything animates smoothly via rAF.

const CLICK_BOOST = 2.5

export function createWeightState(ids, baseWeights) {
  const state = {}
  for (const id of ids) {
    const base = baseWeights[id] ?? 1.0
    state[id] = { current: base, target: base, base }
  }
  return state
}

export function applyClick(state, clickedId, baseWeights) {
  const next = {}
  const ids = Object.keys(state)

  // Click on background → everything returns to base
  if (clickedId === null) {
    for (const id of ids) {
      const base = baseWeights[id] ?? 1.0
      next[id] = { ...state[id], target: base }
    }
    return next
  }

  const clicked = state[clickedId]
  const base = baseWeights[clickedId] ?? 1.0
  const isAlreadyBoosted = clicked.target > base + 0.5

  for (const id of ids) {
    const idBase = baseWeights[id] ?? 1.0
    if (id === clickedId) {
      // Toggle: if already boosted, go back to base
      next[id] = {
        ...state[id],
        target: isAlreadyBoosted ? idBase : idBase + CLICK_BOOST,
      }
    } else {
      // Siblings return to base
      next[id] = { ...state[id], target: idBase }
    }
  }

  return next
}

export function getEffectiveWeights(state) {
  const weights = {}
  for (const [id, s] of Object.entries(state)) {
    weights[id] = s.current
  }
  return weights
}

export function getTargetWeights(state) {
  const weights = {}
  for (const [id, s] of Object.entries(state)) {
    weights[id] = s.target
  }
  return weights
}
