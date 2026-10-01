import type { BusinessGraph, GraphNode, SourceDoc } from './barNorte'

export type AskResult = {
  presetId: string
  nodeIds: string[]
  /** Human-readable answer keys resolved by the UI from content + nodes */
  summary: { en: string; es: string }
  sources: SourceDoc[]
}

function daysFrom(asOf: Date, iso: string): number {
  const target = new Date(iso + 'T00:00:00Z')
  const start = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
  )
  const end = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
  )
  return Math.round((end - start) / 86_400_000)
}

/** Assets that have a finance edge and no coverage edge pointing at them. */
export function findUncoveredFinancedAssets(graph: BusinessGraph): GraphNode[] {
  const financed = new Set(
    graph.edges.filter((e) => e.kind === 'finances').map((e) => e.from),
  )
  const protectedAssets = new Set(
    graph.edges.filter((e) => e.kind === 'protects').map((e) => e.to),
  )
  return graph.nodes.filter(
    (n) =>
      n.type === 'asset' && financed.has(n.id) && !protectedAssets.has(n.id),
  )
}

/** Nodes with renewsOn within the next `withinDays` days from `asOf`. */
export function findRenewalsWithin(
  graph: BusinessGraph,
  withinDays: number,
  asOf: Date = new Date(),
): GraphNode[] {
  return graph.nodes.filter((n) => {
    if (!n.renewsOn) return false
    const d = daysFrom(asOf, n.renewsOn)
    return d >= 0 && d <= withinDays
  })
}

/** Counterparty that receives rent: debt-rent → party_to → counterparty. */
export function findRentRecipient(graph: BusinessGraph): GraphNode | undefined {
  const rent = graph.nodes.find((n) => n.id === 'debt-rent')
  if (!rent) return undefined
  const edge = graph.edges.find(
    (e) => e.from === rent.id && e.kind === 'party_to',
  )
  if (!edge) return undefined
  return graph.nodes.find((n) => n.id === edge.to)
}

export function sourcesForNodes(
  graph: BusinessGraph,
  nodes: GraphNode[],
): SourceDoc[] {
  const ids = new Set(nodes.map((n) => n.sourceId))
  return graph.sources.filter((s) => ids.has(s.id))
}

export function answerPreset(
  graph: BusinessGraph,
  presetId: string,
  asOf: Date = new Date(),
): AskResult {
  if (presetId === 'uncovered') {
    const nodes = findUncoveredFinancedAssets(graph)
    return {
      presetId,
      nodeIds: nodes.map((n) => n.id),
      summary: {
        en:
          nodes.length === 0
            ? 'No financed assets without coverage.'
            : `${nodes.map((n) => n.label.en).join(', ')} — financed, with no insurance link.`,
        es:
          nodes.length === 0
            ? 'Ningún activo financiado sin cobertura.'
            : `${nodes.map((n) => n.label.es).join(', ')} — financiado, sin enlace de seguro.`,
      },
      sources: sourcesForNodes(graph, nodes),
    }
  }

  if (presetId === 'renewals') {
    const nodes = findRenewalsWithin(graph, 90, asOf)
    return {
      presetId,
      nodeIds: nodes.map((n) => n.id),
      summary: {
        en:
          nodes.length === 0
            ? 'Nothing renews in the next 90 days.'
            : nodes.map((n) => `${n.label.en} (${n.renewsOn})`).join(' · '),
        es:
          nodes.length === 0
            ? 'Nada se renueva en los próximos 90 días.'
            : nodes.map((n) => `${n.label.es} (${n.renewsOn})`).join(' · '),
      },
      sources: sourcesForNodes(graph, nodes),
    }
  }

  if (presetId === 'rent') {
    const recipient = findRentRecipient(graph)
    const nodes = recipient ? [recipient] : []
    return {
      presetId,
      nodeIds: nodes.map((n) => n.id),
      summary: {
        en: recipient
          ? `${recipient.label.en} receives the monthly rent.`
          : 'No rent recipient found.',
        es: recipient
          ? `${recipient.label.es} cobra la renta mensual.`
          : 'No se encontró quien cobra el alquiler.',
      },
      sources: sourcesForNodes(graph, nodes),
    }
  }

  return {
    presetId,
    nodeIds: [],
    summary: { en: 'Unknown question.', es: 'Pregunta desconocida.' },
    sources: [],
  }
}

/** Assert every answer cites a source that exists on the graph. */
export function citationsValid(
  graph: BusinessGraph,
  result: AskResult,
): boolean {
  const sourceIds = new Set(graph.sources.map((s) => s.id))
  return result.sources.every((s) => sourceIds.has(s.id))
}
