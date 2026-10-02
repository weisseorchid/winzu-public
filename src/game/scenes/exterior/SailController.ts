import {
  ARRIVE_RADIUS,
  MARKER_POSITIONS,
  resolveSailTarget,
  setBoatTarget,
  tickBoat,
  type BoatState,
} from '../../BoatController'

export type SailController = {
  resetLatch(): void
  navigate(x: number, z: number, markersReached: number): void
  clickMarker(
    index: number,
    markersReached: number,
    reducedMotion: boolean,
  ): void
  update(dt: number, markersReached: number, reducedMotion: boolean): void
  dispose(): void
}

export function createSailController(opts: {
  boatState: BoatState
  onReachMarker: (index: number) => void
}): SailController {
  let markerLatched = -1

  return {
    resetLatch() {
      markerLatched = -1
    },

    navigate(x, z, markersReached) {
      const resolved = resolveSailTarget(x, z, markersReached)
      setBoatTarget(opts.boatState, resolved.x, resolved.z)
    },

    clickMarker(index, markersReached, reducedMotion) {
      if (reducedMotion || markersReached !== index) return
      const pos = MARKER_POSITIONS[index]
      if (!pos) return
      setBoatTarget(opts.boatState, pos[0], pos[2])
    },

    update(dt, markersReached, reducedMotion) {
      if (reducedMotion) return
      tickBoat(opts.boatState, dt)
      const boat = opts.boatState.position
      if (markersReached < MARKER_POSITIONS.length) {
        const wp = MARKER_POSITIONS[markersReached]!
        const d = Math.hypot(boat.x - wp[0], boat.z - wp[2])
        if (d < ARRIVE_RADIUS && markerLatched !== markersReached) {
          markerLatched = markersReached
          opts.onReachMarker(markersReached)
        }
      }
    },

    dispose() {},
  }
}
