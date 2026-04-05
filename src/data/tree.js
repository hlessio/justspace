// Test tree — each node has an icon name (from lucide-react)
// Icons render at every size. Text layers appear by priority: identity first, then context, then detail.

export const testTree = {
  id: 'root',
  label: 'Root',
  baseWeight: 1,
  children: [
    {
      id: 'search',
      label: 'Search',
      icon: 'Search',
      baseWeight: 0.8,
      semanticLayers: [
        { layer: 'identity', text: 'Search' },
      ],
      children: [],
    },
    {
      id: 'calendario',
      label: 'Calendario',
      icon: 'Calendar',
      baseWeight: 1.0,
      semanticLayers: [
        { layer: 'identity', text: 'Calendario' },
        { layer: 'context', text: '7 giorni' },
      ],
      children: [
        {
          id: 'lun7', label: 'Lun 7', icon: 'Sun', baseWeight: 0.5,
          semanticLayers: [
            { layer: 'identity', text: 'Lun 7' },
            { layer: 'context', text: '2 eventi' },
          ],
          children: [
            { id: 'eventoA', label: 'Evento A', icon: 'Clock', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Evento A' }, { layer: 'detail', text: 'Meeting design review alle 10:00' }], children: [] },
            { id: 'eventoB', label: 'Evento B', icon: 'Clock', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Evento B' }, { layer: 'detail', text: 'Call cliente alle 15:00' }], children: [] },
          ],
        },
        {
          id: 'mar8', label: 'Mar 8', icon: 'Sun', baseWeight: 0.5,
          semanticLayers: [{ layer: 'identity', text: 'Mar 8' }, { layer: 'context', text: '1 evento' }],
          children: [
            { id: 'eventoC', label: 'Evento C', icon: 'Clock', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Evento C' }, { layer: 'detail', text: 'Presentazione progetto' }], children: [] },
          ],
        },
        { id: 'mer9', label: 'Mer 9', icon: 'Sun', baseWeight: 0.5, semanticLayers: [{ layer: 'identity', text: 'Mer 9' }], children: [] },
        { id: 'gio10', label: 'Gio 10', icon: 'Sun', baseWeight: 0.5, semanticLayers: [{ layer: 'identity', text: 'Gio 10' }], children: [] },
        { id: 'ven11', label: 'Ven 11', icon: 'Sun', baseWeight: 0.5, semanticLayers: [{ layer: 'identity', text: 'Ven 11' }], children: [] },
        { id: 'sab12', label: 'Sab 12', icon: 'CloudSun', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Sab 12' }], children: [] },
        { id: 'dom13', label: 'Dom 13', icon: 'CloudSun', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Dom 13' }], children: [] },
      ],
    },
    {
      id: 'progetti',
      label: 'Progetti',
      icon: 'FolderKanban',
      baseWeight: 1.0,
      semanticLayers: [
        { layer: 'identity', text: 'Progetti' },
        { layer: 'context', text: '3 attivi' },
      ],
      children: [
        {
          id: 'bulgari', label: 'Bulgari', icon: 'Gem', baseWeight: 0.5,
          semanticLayers: [{ layer: 'identity', text: 'Bulgari' }, { layer: 'context', text: 'In corso' }],
          children: [
            { id: 'task1', label: 'Task 1', icon: 'CircleDot', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Task 1' }, { layer: 'detail', text: 'Revisione moodboard' }], children: [] },
            { id: 'task2', label: 'Task 2', icon: 'CircleDot', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Task 2' }, { layer: 'detail', text: 'Storyboard v2' }], children: [] },
            { id: 'docX', label: 'Doc X', icon: 'FileText', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Doc X' }, { layer: 'detail', text: 'Brief creativo aggiornato' }], children: [] },
          ],
        },
        {
          id: 'valentino', label: 'Valentino', icon: 'Gem', baseWeight: 0.5,
          semanticLayers: [{ layer: 'identity', text: 'Valentino' }, { layer: 'context', text: 'In revisione' }],
          children: [
            { id: 'task3', label: 'Task 3', icon: 'CircleDot', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Task 3' }, { layer: 'detail', text: 'Color grading finale' }], children: [] },
            { id: 'task4', label: 'Task 4', icon: 'CircleDot', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Task 4' }, { layer: 'detail', text: 'Export deliverables' }], children: [] },
          ],
        },
        {
          id: 'gucci', label: 'Gucci', icon: 'Gem', baseWeight: 0.5,
          semanticLayers: [{ layer: 'identity', text: 'Gucci' }, { layer: 'context', text: 'Nuovo' }],
          children: [],
        },
      ],
    },
    {
      id: 'documenti',
      label: 'Documenti',
      icon: 'Files',
      baseWeight: 0.8,
      semanticLayers: [
        { layer: 'identity', text: 'Documenti' },
        { layer: 'context', text: '3 file' },
      ],
      children: [
        { id: 'briefA', label: 'Brief A', icon: 'FileText', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Brief A' }, { layer: 'detail', text: 'Brief campagna primavera' }], children: [] },
        { id: 'treatmentB', label: 'Treatment B', icon: 'FileText', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Treatment B' }, { layer: 'detail', text: 'Treatment video istituzionale' }], children: [] },
        { id: 'scriptC', label: 'Script C', icon: 'FileText', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Script C' }, { layer: 'detail', text: 'Script spot 30s' }], children: [] },
      ],
    },
    {
      id: 'task',
      label: 'Task',
      icon: 'CheckSquare',
      baseWeight: 0.8,
      semanticLayers: [
        { layer: 'identity', text: 'Task' },
        { layer: 'context', text: '3 todo' },
      ],
      children: [
        { id: 'todo1', label: 'Todo 1', icon: 'Circle', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Todo 1' }, { layer: 'detail', text: 'Inviare preventivo' }], children: [] },
        { id: 'todo2', label: 'Todo 2', icon: 'Circle', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Todo 2' }, { layer: 'detail', text: 'Aggiornare portfolio' }], children: [] },
        { id: 'todo3', label: 'Todo 3', icon: 'Circle', baseWeight: 0.3, semanticLayers: [{ layer: 'identity', text: 'Todo 3' }, { layer: 'detail', text: 'Chiamare fornitore' }], children: [] },
      ],
    },
  ],
}

export function getBaseWeights(children) {
  const weights = {}
  for (const child of children) {
    weights[child.id] = child.baseWeight
  }
  return weights
}
