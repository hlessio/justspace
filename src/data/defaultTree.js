// Default tree for note-taking — the starting point for a new user.
// Adding a feature = adding a node. The spatial engine does the rest.

export const defaultTree = {
  id: 'root',
  label: 'Root',
  baseWeight: 1,
  // Layout: first row = inbox + projects side by side, second row = notes + archive
  layout: [['inbox', 'progetti'], ['note', 'archivio']],
  children: [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: 'Inbox',
      baseWeight: 0.8,
      semanticLayers: [
        { layer: 'identity', text: 'Inbox' },
        { layer: 'context', text: 'Cattura rapida' },
      ],
      children: [
        {
          id: 'nota-1',
          label: 'Idea progetto',
          icon: 'Lightbulb',
          baseWeight: 0.4,
          semanticLayers: [
            { layer: 'identity', text: 'Idea progetto' },
            { layer: 'detail', text: 'Esplorare interfaccia spaziale per client presentation...' },
          ],
          children: [],
        },
        {
          id: 'nota-2',
          label: 'Call domani',
          icon: 'Phone',
          baseWeight: 0.3,
          semanticLayers: [
            { layer: 'identity', text: 'Call domani' },
            { layer: 'detail', text: 'Preparare deck, confermare orario con il team' },
          ],
          children: [],
        },
      ],
    },
    {
      id: 'progetti',
      label: 'Progetti',
      icon: 'FolderKanban',
      baseWeight: 1.0,
      semanticLayers: [
        { layer: 'identity', text: 'Progetti' },
        { layer: 'context', text: '2 attivi' },
      ],
      children: [
        {
          id: 'proj-bulgari',
          label: 'Bulgari',
          icon: 'Gem',
          baseWeight: 0.5,
          semanticLayers: [
            { layer: 'identity', text: 'Bulgari' },
            { layer: 'context', text: 'In corso' },
          ],
          children: [
            {
              id: 'bulgari-brief',
              label: 'Brief',
              icon: 'FileText',
              baseWeight: 0.4,
              semanticLayers: [
                { layer: 'identity', text: 'Brief' },
                { layer: 'detail', text: 'Campagna primavera 2026. Target: giovane, luxury casual. Deliverable: 3 video 30s + social kit.' },
              ],
              children: [],
            },
            {
              id: 'bulgari-moodboard',
              label: 'Moodboard',
              icon: 'Image',
              baseWeight: 0.3,
              semanticLayers: [
                { layer: 'identity', text: 'Moodboard' },
                { layer: 'detail', text: 'Riferimenti: luce naturale, toni caldi, architettura romana contemporanea' },
              ],
              children: [],
            },
            {
              id: 'bulgari-todo',
              label: 'Todo',
              icon: 'CheckSquare',
              baseWeight: 0.3,
              semanticLayers: [
                { layer: 'identity', text: 'Todo' },
                { layer: 'detail', text: 'Revisione moodboard\nStoryboard v2\nCall con regista' },
              ],
              children: [],
            },
          ],
        },
        {
          id: 'proj-valentino',
          label: 'Valentino',
          icon: 'Gem',
          baseWeight: 0.5,
          semanticLayers: [
            { layer: 'identity', text: 'Valentino' },
            { layer: 'context', text: 'In revisione' },
          ],
          children: [
            {
              id: 'valentino-treatment',
              label: 'Treatment',
              icon: 'FileText',
              baseWeight: 0.4,
              semanticLayers: [
                { layer: 'identity', text: 'Treatment' },
                { layer: 'detail', text: 'Video istituzionale 2min. Concept: il rosso come filo conduttore tra heritage e futuro.' },
              ],
              children: [],
            },
            {
              id: 'valentino-edit',
              label: 'Edit notes',
              icon: 'Film',
              baseWeight: 0.3,
              semanticLayers: [
                { layer: 'identity', text: 'Edit notes' },
                { layer: 'detail', text: 'Color grading finale\nExport deliverables\nRevisione audio' },
              ],
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'note',
      label: 'Note',
      icon: 'StickyNote',
      baseWeight: 1.0,
      semanticLayers: [
        { layer: 'identity', text: 'Note' },
        { layer: 'context', text: 'Spazio libero' },
      ],
      children: [
        {
          id: 'note-riflessioni',
          label: 'Riflessioni',
          icon: 'PenLine',
          baseWeight: 0.5,
          semanticLayers: [
            { layer: 'identity', text: 'Riflessioni' },
            { layer: 'detail', text: 'L\'interfaccia spaziale funziona perché elimina il context switch tra navigazione e contenuto. Navigare È guardare il contenuto.' },
          ],
          children: [],
        },
        {
          id: 'note-reference',
          label: 'Riferimenti',
          icon: 'BookOpen',
          baseWeight: 0.4,
          semanticLayers: [
            { layer: 'identity', text: 'Riferimenti' },
            { layer: 'detail', text: 'Bret Victor — Seeing Spaces\nAndy Matuschak — Spatial software\nDynamicland' },
          ],
          children: [],
        },
      ],
    },
    {
      id: 'archivio',
      label: 'Archivio',
      icon: 'Archive',
      baseWeight: 0.4,
      semanticLayers: [
        { layer: 'identity', text: 'Archivio' },
        { layer: 'context', text: 'Completati' },
      ],
      children: [],
    },
  ],
}
