import { describe, expect, it } from 'vitest'
import {
  MARKER_POSITIONS,
  createBoatState,
  resolveSailTarget,
  setBoatTarget,
  tickBoat,
} from './BoatController'

describe('resolveSailTarget', () => {
  it('snaps near the active marker', () => {
    const wp = MARKER_POSITIONS[0]!
    const r = resolveSailTarget(wp[0] + 2, wp[2] + 1.5, 0)
    expect(r.snapped).toBe(true)
    expect(r.x).toBe(wp[0])
    expect(r.z).toBe(wp[2])
  })

  it('gates clicks past unanswered markers', () => {
    const wp = MARKER_POSITIONS[0]!
    const r = resolveSailTarget(0, -30, 0)
    expect(r.snapped).toBe(false)
    expect(r.z).toBeGreaterThanOrEqual(wp[2] - 0.5)
  })

  it('does not snap to lighthouse after all markers', () => {
    const r = resolveSailTarget(0, -40, MARKER_POSITIONS.length)
    expect(r.snapped).toBe(false)
  })
})

describe('tickBoat', () => {
  it('smoothly turns toward the target instead of snapping', () => {
    const state = createBoatState()
    state.heading = 0
    setBoatTarget(state, 0, -10)
    tickBoat(state, 1 / 60)
    expect(state.heading).toBeGreaterThan(0.01)
    expect(state.heading).toBeLessThan(Math.PI)
  })
})
