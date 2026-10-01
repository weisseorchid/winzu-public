export type NodeType = 'asset' | 'debt' | 'coverage' | 'counterparty'

export type GraphNode = {
  id: string
  type: NodeType
  label: { en: string; es: string }
  detail: { en: string; es: string }
  /** ISO date when relevant (renewal / maturity) */
  renewsOn?: string
  /** Linked document id for citation */
  sourceId: string
  /** Position in the map scene (local space) */
  position: [number, number, number]
}

export type GraphEdge = {
  id: string
  from: string
  to: string
  kind: 'owns' | 'owes' | 'protects' | 'party_to' | 'finances'
}

export type SourceDoc = {
  id: string
  title: { en: string; es: string }
  snippet: { en: string; es: string }
  confidence: number
}

export type BusinessGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  sources: SourceDoc[]
}

/** Fictional Chamberí restaurant used for the living-map demo. */
export const barNorte: BusinessGraph = {
  sources: [
    {
      id: 'doc-lease',
      title: {
        en: 'Commercial lease — Calle de Fuencarral 112',
        es: 'Arrendamiento comercial — Calle de Fuencarral 112',
      },
      snippet: {
        en: '§4.2 Rent of €3,200 payable monthly to Inmobiliaria Solana S.L. Renews 15 Nov 2026.',
        es: '§4.2 Renta de 3.200 € pagadera mensualmente a Inmobiliaria Solana S.L. Renueva el 15 nov 2026.',
      },
      confidence: 0.94,
    },
    {
      id: 'doc-loan',
      title: {
        en: 'Equipment loan — Banco Norte',
        es: 'Préstamo de equipo — Banco Norte',
      },
      snippet: {
        en: 'Kitchen fit-out financed for €48,000. Collateral: commercial kitchen equipment inventory.',
        es: 'Acondicionamiento de cocina financiado por 48.000 €. Garantía: inventario de cocina comercial.',
      },
      confidence: 0.91,
    },
    {
      id: 'doc-policy',
      title: {
        en: 'Multi-risk policy — Mutua Iberia',
        es: 'Póliza multirriesgo — Mutua Iberia',
      },
      snippet: {
        en: 'Coverage for premises contents and civil liability. Excludes equipment under separate finance. Renews 1 Oct 2026.',
        es: 'Cobertura de contenido del local y responsabilidad civil. Excluye equipo bajo financiación aparte. Renueva el 1 oct 2026.',
      },
      confidence: 0.88,
    },
    {
      id: 'doc-guarantee',
      title: {
        en: 'Bank guarantee — Banco Norte',
        es: 'Aval bancario — Banco Norte',
      },
      snippet: {
        en: 'Deposit guarantee of three months’ rent held by Banco Norte for the lessor.',
        es: 'Aval de depósito de tres mensualidades de renta retenido por Banco Norte a favor del arrendador.',
      },
      confidence: 0.72,
    },
  ],
  nodes: [
    {
      id: 'asset-premises',
      type: 'asset',
      label: { en: 'Premises', es: 'Local' },
      detail: {
        en: 'Ground-floor commercial unit, Calle de Fuencarral 112',
        es: 'Local comercial en planta baja, Calle de Fuencarral 112',
      },
      sourceId: 'doc-lease',
      position: [-1.4, 0.4, 0],
    },
    {
      id: 'asset-kitchen',
      type: 'asset',
      label: { en: 'Kitchen equipment', es: 'Equipo de cocina' },
      detail: {
        en: 'Financed fit-out: ovens, cold line, extraction',
        es: 'Acondicionamiento financiado: hornos, línea de frío, extracción',
      },
      sourceId: 'doc-loan',
      position: [0.2, 1.1, 0.3],
    },
    {
      id: 'debt-rent',
      type: 'debt',
      label: { en: 'Monthly rent', es: 'Renta mensual' },
      detail: {
        en: '€3,200 / month · renews 15 Nov 2026',
        es: '3.200 € / mes · renueva 15 nov 2026',
      },
      renewsOn: '2026-11-15',
      sourceId: 'doc-lease',
      position: [-2.2, -0.6, 0.2],
    },
    {
      id: 'debt-loan',
      type: 'debt',
      label: { en: 'Equipment loan', es: 'Préstamo de equipo' },
      detail: {
        en: '€48,000 outstanding to Banco Norte',
        es: '48.000 € pendientes con Banco Norte',
      },
      sourceId: 'doc-loan',
      position: [1.6, 0.5, -0.2],
    },
    {
      id: 'cov-policy',
      type: 'coverage',
      label: { en: 'Multi-risk policy', es: 'Póliza multirriesgo' },
      detail: {
        en: 'Contents + liability · renews 1 Oct 2026 · excludes financed kitchen',
        es: 'Contenido + RC · renueva 1 oct 2026 · excluye cocina financiada',
      },
      renewsOn: '2026-10-01',
      sourceId: 'doc-policy',
      position: [-0.6, -1.0, 0.4],
    },
    {
      id: 'cov-guarantee',
      type: 'coverage',
      label: { en: 'Rent guarantee', es: 'Aval de renta' },
      detail: {
        en: 'Three months’ rent held for the lessor',
        es: 'Tres mensualidades retenidas a favor del arrendador',
      },
      sourceId: 'doc-guarantee',
      position: [1.1, -0.9, 0.1],
    },
    {
      id: 'cp-solana',
      type: 'counterparty',
      label: { en: 'Inmobiliaria Solana', es: 'Inmobiliaria Solana' },
      detail: {
        en: 'Lessor · receives monthly rent',
        es: 'Arrendador · cobra la renta mensual',
      },
      sourceId: 'doc-lease',
      position: [-2.4, 0.9, -0.3],
    },
    {
      id: 'cp-banco',
      type: 'counterparty',
      label: { en: 'Banco Norte', es: 'Banco Norte' },
      detail: {
        en: 'Lender and guarantee issuer',
        es: 'Prestamista y emisor del aval',
      },
      sourceId: 'doc-loan',
      position: [2.3, -0.2, 0.2],
    },
    {
      id: 'cp-mutua',
      type: 'counterparty',
      label: { en: 'Mutua Iberia', es: 'Mutua Iberia' },
      detail: {
        en: 'Insurer on the multi-risk policy',
        es: 'Aseguradora de la póliza multirriesgo',
      },
      sourceId: 'doc-policy',
      position: [0.4, -1.8, -0.2],
    },
  ],
  edges: [
    { id: 'e1', from: 'asset-premises', to: 'debt-rent', kind: 'owes' },
    { id: 'e2', from: 'debt-rent', to: 'cp-solana', kind: 'party_to' },
    { id: 'e3', from: 'asset-premises', to: 'cp-solana', kind: 'party_to' },
    { id: 'e4', from: 'asset-kitchen', to: 'debt-loan', kind: 'finances' },
    { id: 'e5', from: 'debt-loan', to: 'cp-banco', kind: 'party_to' },
    { id: 'e6', from: 'cov-policy', to: 'asset-premises', kind: 'protects' },
    { id: 'e7', from: 'cov-policy', to: 'cp-mutua', kind: 'party_to' },
    { id: 'e8', from: 'cov-guarantee', to: 'debt-rent', kind: 'protects' },
    { id: 'e9', from: 'cov-guarantee', to: 'cp-banco', kind: 'party_to' },
  ],
}
