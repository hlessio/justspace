// Default tree for the spatial notes app — minimal starting point.
// One folder, one welcome note. The user builds their own space.

export const defaultNotesTree = {
  id: 'root',
  type: 'folder',
  label: 'Root',
  baseWeight: 1,
  children: [
    {
      id: 'scrivania',
      type: 'folder',
      label: 'Scrivania',
      icon: 'Laptop',
      baseWeight: 1.0,
      semanticLayers: [
        { layer: 'identity', text: 'Scrivania' },
      ],
      children: [
        {
          id: 'benvenuto',
          type: 'note',
          label: 'Benvenuto',
          icon: 'FileText',
          baseWeight: 0.5,
          semanticLayers: [
            { layer: 'identity', text: 'Benvenuto' },
            { layer: 'detail', text: 'Questo è il tuo spazio.\nClicca per espandere, crea note e cartelle.\nOrganizza tutto come vuoi — è la tua scrivania.' },
          ],
          children: [],
        },
      ],
    },
  ],
}
