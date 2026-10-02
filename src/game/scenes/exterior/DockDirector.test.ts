import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { DOCK } from '../../director/timelines'
import { createBoatState } from '../../BoatController'
import { createDockDirector } from './DockDirector'
import type { ExteriorVisuals } from './types'

function mockVisuals(): ExteriorVisuals {
  const root = new THREE.Group()
  const boatGroup = new THREE.Group()
  root.add(boatGroup)
  const girlGroup = new THREE.Group()
  boatGroup.add(girlGroup)
  return {
    root,
    boat: {
      group: boatGroup,
      root: boatGroup,
      update: () => {},
    },
    girl: {
      group: girlGroup,
      setPose: () => {},
      update: () => {},
    },
  } as unknown as ExteriorVisuals
}

describe('DockDirector', () => {
  it('latches onComplete once when dock finishes', () => {
    const onComplete = vi.fn()
    const boatState = createBoatState()
    const director = createDockDirector({ onComplete, boatState })
    const visuals = mockVisuals()
    director.enter(visuals)

    const dt = 0.1
    let elapsed = 0
    for (let i = 0; i < 200; i++) {
      elapsed += dt
      director.update(dt, elapsed, visuals, false)
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('completes immediately under reducedMotion', () => {
    const onComplete = vi.fn()
    const boatState = createBoatState()
    const director = createDockDirector({ onComplete, boatState })
    const visuals = mockVisuals()
    director.enter(visuals)
    director.update(0.016, 0, visuals, true)
    director.update(0.016, 0.016, visuals, true)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('keeps girl on boat during approach', () => {
    const onComplete = vi.fn()
    const boatState = createBoatState()
    const director = createDockDirector({ onComplete, boatState })
    const visuals = mockVisuals()
    // Start with girl on root (enter moves her there)
    director.enter(visuals)
    expect(visuals.girl.group.parent).toBe(visuals.root)

    director.update(DOCK.approach * 0.5, DOCK.approach * 0.5, visuals, false)
    expect(visuals.girl.group.parent).toBe(visuals.boat.group)
    expect(onComplete).not.toHaveBeenCalled()
  })
})
