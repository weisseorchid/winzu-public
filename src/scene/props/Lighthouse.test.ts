import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { COLORS } from '../config'
import { createLighthouse } from './Lighthouse'

describe('createLighthouse', () => {
  it('setVisual replaces children and update stays safe on Lantern_Glass', () => {
    const sunDir = new THREE.Vector3(-0.5, 0.2, -0.8).normalize()
    const handle = createLighthouse(sunDir)

    expect(handle.root.getObjectByName('Lantern')).toBeTruthy()
    expect(handle.root.getObjectByName('LanternBeam')).toBeTruthy()

    const stub = new THREE.Group()
    stub.name = 'LighthouseGlb'
    const lanternMat = new THREE.MeshBasicMaterial({
      color: COLORS.lantern.clone().multiplyScalar(4.2),
      toneMapped: false,
    })
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.5, 0.4),
      lanternMat,
    )
    glass.name = 'Lantern_Glass'
    glass.position.y = 5.5
    stub.add(glass)

    handle.setVisual(stub)

    expect(handle.root.getObjectByName('Lantern')).toBeUndefined()
    expect(handle.root.getObjectByName('Lantern_Glass')).toBe(glass)
    expect(handle.root.getObjectByName('LanternBeam')).toBeTruthy()
    expect(handle.root.getObjectByName('LanternLight')).toBeTruthy()
    expect(handle.root.getObjectByName('Flag')).toBeTruthy()

    expect(() => handle.update(1.25, true)).not.toThrow()
    expect(lanternMat.color.equals(COLORS.lantern.clone().multiplyScalar(6.0))).toBe(
      true,
    )

    expect(() => handle.update(2.0, false)).not.toThrow()
    expect(lanternMat.color.equals(COLORS.lantern.clone().multiplyScalar(4.2))).toBe(
      true,
    )
  })

  it('update is a no-op when lantern FX are absent after an empty swap', () => {
    const sunDir = new THREE.Vector3(-0.5, 0.2, -0.8).normalize()
    const handle = createLighthouse(sunDir)

    // Bypass setVisual dressing: clear to empty visual without FX
    while (handle.root.children.length) {
      handle.root.remove(handle.root.children[0]!)
    }

    expect(() => handle.update(0.5, true)).not.toThrow()
  })
})
