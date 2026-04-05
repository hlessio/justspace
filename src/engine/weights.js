export function createWeightState(ids, baseWeights) {
  const state = {}
  for (const id of ids) {
    const base = baseWeights[id] ?? 1.0
    state[id] = { current: base, target: base, base, hover: 0 }
  }
  return state
}

export function applyClick(state, clickedId, baseWeights) {
  const next = {}
  const ids = Object.keys(state)

  if (clickedId === null) {
    for (const id of ids) {
      next[id] = { ...state[id], target: baseWeights[id] ?? 1.0 }
    }
    return next
  }

  const clicked = state[clickedId]
  const currentCheckpoint = nearestCheckpoint(clicked.target)

  if (currentCheckpoint < 2) {
    for (const id of ids) {
      if (id === clickedId) {
        next[id] = { ...state[id], target: 2 }
      } else {
        const siblingCheckpoint = nearestCheckpoint(state[id].target)
        next[id] = {
          ...state[id],
          target: siblingCheckpoint >= 2 ? baseWeights[id] ?? 1.0 : state[id].target,
        }
      }
    }
  } else if (currentCheckpoint < 3) {
    for (const id of ids) {
      if (id === clickedId) {
        next[id] = { ...state[id], target: 3 }
      } else {
        next[id] = { ...state[id], target: baseWeights[id] ?? 1.0 }
      }
    }
  } else {
    for (const id of ids) {
      if (id === clickedId) {
        next[id] = { ...state[id], target: 2 }
      } else {
        next[id] = { ...state[id], target: baseWeights[id] ?? 1.0 }
      }
    }
  }

  return next
}

export function applyHover(state, hoveredId, intensity) {
  const next = {}
  for (const id of Object.keys(state)) {
    next[id] = { ...state[id], hover: id === hoveredId ? intensity : state[id].hover }
  }
  return next
}

export function getEffectiveWeights(state) {
  const weights = {}
  for (const [id, s] of Object.entries(state)) {
    weights[id] = s.current + s.hover
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

function nearestCheckpoint(weight) {
  if (weight >= 2.5) return 3
  if (weight >= 1.5) return 2
  return 1
}
