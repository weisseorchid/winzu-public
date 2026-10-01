import { describe, expect, it } from 'vitest'
import {
  completeDock,
  completeIntro,
  closeDeskFocus,
  openDeskFocus,
  reachMarker,
} from './SceneDirector'
import { MARKERS_TOTAL } from '../BoatController'
import { initialGameState, skipToDesk } from '../types'

const TOTAL = MARKERS_TOTAL

describe('SceneDirector', () => {
  it('intro → sail', () => {
    const s0 = initialGameState(false, TOTAL)
    expect(s0.scene).toBe('intro')
    expect(completeIntro(s0).scene).toBe('sail')
  })

  it('advances markers and docks on the last', () => {
    let s = initialGameState(false, TOTAL)
    s = { ...s, scene: 'sail' }
    for (let i = 0; i < TOTAL - 1; i++) {
      s = reachMarker(s, i)
      expect(s.scene).toBe('sail')
      expect(s.markersReached).toBe(i + 1)
    }
    s = reachMarker(s, TOTAL - 1)
    expect(s.scene).toBe('dock')
    expect(s.markersReached).toBe(TOTAL)
  })

  it('dock → desk', () => {
    const s = { ...skipToDesk(TOTAL), scene: 'dock' as const }
    expect(completeDock(s).scene).toBe('desk')
  })

  it('opens and closes desk focus', () => {
    let s = skipToDesk(TOTAL)
    s = openDeskFocus(s, 'map')
    expect(s.deskFocus).toBe('map')
    s = openDeskFocus(s, 'doc', 'letter_burn')
    expect(s.deskFocus).toBe('doc')
    expect(s.activeDocId).toBe('letter_burn')
    s = closeDeskFocus(s)
    expect(s.deskFocus).toBeNull()
    expect(s.activeDocId).toBeNull()
  })

  it('reduced motion starts at sail', () => {
    expect(initialGameState(true, TOTAL).scene).toBe('sail')
  })
})
