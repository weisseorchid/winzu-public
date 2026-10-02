import * as THREE from 'three'
import { LAYOUT_WORLD } from '../../../scene/layout'
import {
  DOCK_POSITION,
  setBoatTarget,
  tickBoat,
  type BoatState,
} from '../../BoatController'
import { DOCK, dockPhase, segmentProgress } from '../../director/timelines'
import type { ExteriorVisuals } from './types'

export type DockDirector = {
  /** Absolute dock clock (seconds). Camera rig reads this. */
  t: { current: number }
  reset(): void
  enter(visuals: ExteriorVisuals): void
  update(
    dt: number,
    elapsed: number,
    visuals: ExteriorVisuals,
    reducedMotion: boolean,
  ): void
  dispose(): void
}

export function createDockDirector(opts: {
  onComplete: () => void
  boatState: BoatState
}): DockDirector {
  const t = { current: 0 }
  let done = false

  const reset = () => {
    t.current = 0
    done = false
  }

  const enter = (visuals: ExteriorVisuals) => {
    reset()
    if (visuals.girl.group.parent !== visuals.root) {
      visuals.root.add(visuals.girl.group)
    }
  }

  const update = (
    dt: number,
    elapsed: number,
    visuals: ExteriorVisuals,
    reducedMotion: boolean,
  ) => {
    if (reducedMotion) {
      if (!done) {
        done = true
        opts.onComplete()
      }
      return
    }

    t.current += dt
    const phase = dockPhase(t.current)
    const [dx, dy, dz] = DOCK_POSITION

    if (phase === 'approach') {
      setBoatTarget(opts.boatState, dx, dz)
      tickBoat(opts.boatState, dt, 3.2, 2.8)
      visuals.girl.setPose('sit')
      if (visuals.girl.group.parent !== visuals.boat.group) {
        visuals.boat.group.add(visuals.girl.group)
        visuals.girl.group.position.set(0.05, 0.55, 0.15)
      }
    } else if (phase === 'exit') {
      opts.boatState.target = null
      opts.boatState.position.set(dx, dy, dz)
      if (visuals.girl.group.parent === visuals.boat.group) {
        visuals.root.add(visuals.girl.group)
      }
      const p = segmentProgress(t.current, DOCK.approach, DOCK.exit)
      visuals.girl.setPose('step')
      visuals.girl.group.position.set(
        THREE.MathUtils.lerp(dx, LAYOUT_WORLD.islandDock.x, p),
        0.55,
        THREE.MathUtils.lerp(dz, LAYOUT_WORLD.islandDock.z - 0.5, p),
      )
    } else if (phase === 'establish') {
      visuals.girl.setPose('look')
    } else if (!done) {
      done = true
      opts.onComplete()
    }

    visuals.girl.update(elapsed, reducedMotion)
  }

  return {
    t,
    reset,
    enter,
    update,
    dispose() {},
  }
}
