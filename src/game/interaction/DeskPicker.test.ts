import { describe, expect, it } from 'vitest'
import { resolveDeskIntent } from './DeskPicker'

describe('resolveDeskIntent', () => {
  it('maps map mesh to map intent', () => {
    expect(resolveDeskIntent('map')).toEqual({ kind: 'map' })
  })

  it('maps letters to document intents', () => {
    expect(resolveDeskIntent('letter_burn')).toEqual({
      kind: 'doc',
      docId: 'letter_burn',
    })
  })

  it('ignores decorative props', () => {
    expect(resolveDeskIntent('globe')).toEqual({ kind: 'ignore' })
  })
})
