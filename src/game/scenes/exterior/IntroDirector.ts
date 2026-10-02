import * as THREE from 'three'
import { LAYOUT_WORLD } from '../../../scene/layout'
import { INTRO, introPhase, segmentProgress } from '../../director/timelines'
import type { ExteriorVisuals } from './types'

export type IntroDirector = {
  /** Absolute intro clock (seconds). Camera rig reads this. */
  t: { current: number }
  reset(): void
  /** Place girl on pier in look pose when scene becomes intro. */
  enter(visuals: ExteriorVisuals): void
  update(
    dt: number,
    elapsed: number,
    visuals: ExteriorVisuals,
    reducedMotion: boolean,
  ): void
  dispose(): void
}

export function createIntroDirector(opts: {
  onComplete: () => void
}): IntroDirector {
  const t = { current: 0 }
  let done = false

  const reset = () => {
    t.current = 0
    done = false
  }

  const enter = (visuals: ExteriorVisuals) => {
    reset()
    visuals.girl.group.position.set(
      LAYOUT_WORLD.pier.x,
      0.55,
      LAYOUT_WORLD.pier.z - 0.8,
    )
    visuals.girl.setPose('look')
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
    const phase = introPhase(t.current)
    const pier = LAYOUT_WORLD.pier
    const boatPos = LAYOUT_WORLD.boat

    if (phase === 'look') {
      visuals.girl.setPose('look')
    } else if (phase === 'walk') {
      visuals.girl.setPose('walk')
      const p = segmentProgress(t.current, INTRO.look, INTRO.walk)
      visuals.girl.group.position.set(
        THREE.MathUtils.lerp(pier.x, boatPos.x, p),
        0.55,
        THREE.MathUtils.lerp(pier.z - 0.8, boatPos.z + 0.3, p),
      )
    } else if (phase === 'board') {
      visuals.girl.setPose('sit')
      const p = segmentProgress(t.current, INTRO.look + INTRO.walk, INTRO.board)
      visuals.girl.group.position.set(
        THREE.MathUtils.lerp(boatPos.x, boatPos.x + 0.05, p),
        THREE.MathUtils.lerp(0.55, 0.7, p),
        THREE.MathUtils.lerp(boatPos.z + 0.3, boatPos.z + 0.15, p),
      )
    } else if (!done) {
      done = true
      visuals.girl.group.position.set(0.05, 0.55, 0.15)
      visuals.boat.group.add(visuals.girl.group)
      visuals.girl.setPose('sit')
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
