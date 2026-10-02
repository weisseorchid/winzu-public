import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { INTRO } from '../../director/timelines'
import type { GirlPose } from '../../../scene/props/Girl'
import { createIntroDirector } from './IntroDirector'
import type { ExteriorVisuals } from './types'

function mockVisuals(): ExteriorVisuals {
  const root = new THREE.Group()
  const boatGroup = new THREE.Group()
  root.add(boatGroup)
  const girlGroup = new THREE.Group()
  root.add(girlGroup)
  return {
    root,
    boat: {
      group: boatGroup,
      root: boatGroup,
      update: () => {},
    },
    girl: {
      group: girlGroup,
      setPose: (_p: GirlPose) => {},
      update: () => {},
    },
  } as unknown as ExteriorVisuals
}

describe('IntroDirector', () => {
  it('latches onComplete once when intro finishes', () => {
    const onComplete = vi.fn()
    const director = createIntroDirector({ onComplete })
    const visuals = mockVisuals()
    director.enter(visuals)

    const dt = 0.1
    let elapsed = 0
    for (let i = 0; i < 200; i++) {
      elapsed += dt
      director.update(dt, elapsed, visuals, false)
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(visuals.girl.group.parent).toBe(visuals.boat.group)
  })

  it('completes immediately under reducedMotion', () => {
    const onComplete = vi.fn()
    const director = createIntroDirector({ onComplete })
    const visuals = mockVisuals()
    director.enter(visuals)
    director.update(0.016, 0, visuals, true)
    director.update(0.016, 0.016, visuals, true)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('advances through look before walk', () => {
    const onComplete = vi.fn()
    const director = createIntroDirector({ onComplete })
    const visuals = mockVisuals()
    const poses: GirlPose[] = []
    visuals.girl.setPose = (p: GirlPose) => {
      poses.push(p)
    }
    director.enter(visuals)

    director.update(INTRO.look * 0.5, INTRO.look * 0.5, visuals, false)
    expect(poses.at(-1)).toBe('look')

    director.update(INTRO.look, INTRO.look + 0.1, visuals, false)
    expect(poses.at(-1)).toBe('walk')
    expect(onComplete).not.toHaveBeenCalled()
  })
})
