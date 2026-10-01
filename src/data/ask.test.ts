import { describe, expect, it } from 'vitest'
import { barNorte } from './barNorte'
import {
  answerPreset,
  citationsValid,
  findRenewalsWithin,
  findRentRecipient,
  findUncoveredFinancedAssets,
} from './ask'

describe('findUncoveredFinancedAssets', () => {
  it('returns the financed kitchen with no coverage', () => {
    const uncovered = findUncoveredFinancedAssets(barNorte)
    expect(uncovered.map((n) => n.id)).toEqual(['asset-kitchen'])
  })
})

describe('findRenewalsWithin', () => {
  it('returns lease rent and multi-risk policy within 90 days of 2026-09-28', () => {
    const asOf = new Date('2026-09-28T12:00:00Z')
    const renewals = findRenewalsWithin(barNorte, 90, asOf)
    const ids = renewals.map((n) => n.id).sort()
    expect(ids).toEqual(['cov-policy', 'debt-rent'])
  })
})

describe('findRentRecipient', () => {
  it('returns Inmobiliaria Solana', () => {
    const recipient = findRentRecipient(barNorte)
    expect(recipient?.id).toBe('cp-solana')
  })
})

describe('answerPreset citations', () => {
  const asOf = new Date('2026-09-28T12:00:00Z')

  it.each(['uncovered', 'renewals', 'rent'] as const)(
    '%s points at sources that exist on the graph',
    (presetId) => {
      const result = answerPreset(barNorte, presetId, asOf)
      expect(result.nodeIds.length).toBeGreaterThan(0)
      expect(result.sources.length).toBeGreaterThan(0)
      expect(citationsValid(barNorte, result)).toBe(true)
      for (const nodeId of result.nodeIds) {
        const node = barNorte.nodes.find((n) => n.id === nodeId)
        expect(node).toBeDefined()
        expect(barNorte.sources.some((s) => s.id === node!.sourceId)).toBe(true)
      }
    },
  )
})
