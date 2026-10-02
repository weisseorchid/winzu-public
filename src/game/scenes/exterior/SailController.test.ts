import { describe, expect, it, vi } from 'vitest'
import {
  ARRIVE_RADIUS,
  MARKER_POSITIONS,
  createBoatState,
} from '../../BoatController'
import { createSailController } from './SailController'

describe('SailController', () => {
  it('fires onReachMarker once per marker latch', () => {
    const onReachMarker = vi.fn()
    const boatState = createBoatState()
    const sail = createSailController({ boatState, onReachMarker })
    const wp = MARKER_POSITIONS[0]!
    boatState.position.set(wp[0], 0.15, wp[2])

    sail.update(1 / 60, 0, false)
    sail.update(1 / 60, 0, false)
    expect(onReachMarker).toHaveBeenCalledTimes(1)
    expect(onReachMarker).toHaveBeenCalledWith(0)
  })

  it('does not fire when outside arrive radius', () => {
    const onReachMarker = vi.fn()
    const boatState = createBoatState()
    const sail = createSailController({ boatState, onReachMarker })
    const wp = MARKER_POSITIONS[0]!
    boatState.position.set(wp[0] + ARRIVE_RADIUS + 1, 0.15, wp[2])

    sail.update(1 / 60, 0, false)
    expect(onReachMarker).not.toHaveBeenCalled()
  })

  it('skips update under reducedMotion', () => {
    const onReachMarker = vi.fn()
    const boatState = createBoatState()
    const sail = createSailController({ boatState, onReachMarker })
    const wp = MARKER_POSITIONS[0]!
    boatState.position.set(wp[0], 0.15, wp[2])

    sail.update(1 / 60, 0, true)
    expect(onReachMarker).not.toHaveBeenCalled()
  })
})
