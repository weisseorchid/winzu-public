export type Locale = 'en' | 'es'

export type Document = {
  id: string
  title: string
  body: string
  options?: { id: string; label: string }[]
}

export type Content = {
  brand: string
  fictionalLabel: string
  skipToDesk: string
  clickHint: string
  deskHint: string
  closeFocus: string
  langToggle: { en: string; es: string }
  documents: Document[]
  map: {
    title: string
    subtitle: string
    nodeTypes: Record<'asset' | 'debt' | 'coverage' | 'counterparty', string>
    askPrompt: string
    presets: { id: string; label: string }[]
    source: string
  }
  beats: string[]
  cta: {
    title: string
    body: string
    mail: string
    calendly: string
  }
  footer: string
}

export const en: Content = {
  brand: 'Winzu',
  fictionalLabel: 'A fictional restaurant in Chamberí',
  skipToDesk: 'Skip to desk',
  clickHint: 'Click the water to follow the markers',
  deskHint: 'Click the map or paperwork on the desk',
  closeFocus: 'Back',
  langToggle: { en: 'EN', es: 'ES' },
  documents: [
    {
      id: 'letter_burn',
      title: 'If the place burned tonight',
      body: 'Which paper says what you are owed?',
      options: [
        { id: 'lease', label: 'The lease' },
        { id: 'policy', label: 'The policy' },
        { id: 'unknown', label: 'I don’t know' },
      ],
    },
    {
      id: 'letter_renewal',
      title: 'Renewals on the desk',
      body: 'Which payment renews before anyone remembers it?',
      options: [
        { id: 'rent', label: 'The rent' },
        { id: 'insurance', label: 'The insurance' },
        { id: 'nobody', label: 'Nobody tracks it' },
      ],
    },
    {
      id: 'letter_copy',
      title: 'The only copy',
      body: 'Who, other than the owner, holds the only copy?',
      options: [
        { id: 'asesoria', label: 'The asesoría' },
        { id: 'landlord', label: 'The landlord' },
        { id: 'unsure', label: 'I’m not sure' },
      ],
    },
    {
      id: 'book',
      title: 'Ledger notes',
      body: 'A bound book of payments, renewals, and open questions — open the letters for the sharp edges.',
    },
  ],
  map: {
    title: 'Bar Norte',
    subtitle: 'Chamberí · Madrid — a living map of one fictional place',
    nodeTypes: {
      asset: 'Asset',
      debt: 'Debt',
      coverage: 'Coverage',
      counterparty: 'Counterparty',
    },
    askPrompt: 'Ask the map',
    presets: [
      { id: 'uncovered', label: 'What is uncovered?' },
      { id: 'renewals', label: 'What renews within 90 days?' },
      { id: 'rent', label: 'Who receives the rent?' },
    ],
    source: 'Source',
  },
  beats: [
    'The papers are everywhere. The picture is nowhere.',
    'Upload. Read. Connect assets, debts, coverage, counterparties — every value cites its source.',
    'Phase 1: hospitality SMEs in Madrid. Phase 2: agro-industrial SMEs. ~€20–50/month, discounted beta first.',
    'Later: a real-world asset operating system. Tokenisation is later — not this page.',
  ],
  cta: {
    title: 'Walk through it with us',
    body: 'No account. No upload. Just a conversation.',
    mail: 'Write to us',
    calendly: 'Book a time',
  },
  footer: 'Winzu · static · no backend',
}
