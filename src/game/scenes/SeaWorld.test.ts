import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createRuntime, QUALITY_PROFILES } from '../../scene/config'
import { createSeaWorld, disposeSeaWorld } from './SeaWorld'

describe('disposeSeaWorld', () => {
  it('disposes scenic geometries and materials without throwing', () => {
    const visuals = createSeaWorld(createRuntime(), QUALITY_PROFILES.low)
    const geos: THREE.BufferGeometry[] = []
    const mats: THREE.Material[] = []

    visuals.root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh || (obj as THREE.Line).isLine) {
        if (mesh.geometry) geos.push(mesh.geometry)
        const list = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        for (const m of list) if (m) mats.push(m)
      }
    })

    expect(geos.length).toBeGreaterThan(10)
    expect(mats.length).toBeGreaterThan(5)

    const geoSpies = [...new Set(geos)].map((g) => vi.spyOn(g, 'dispose'))
    const matSpies = [...new Set(mats)].map((m) => vi.spyOn(m, 'dispose'))

    expect(() => disposeSeaWorld(visuals)).not.toThrow()
    expect(visuals.root.children.length).toBe(0)
    expect(visuals.root.parent).toBeNull()

    expect(geoSpies.some((s) => s.mock.calls.length > 0)).toBe(true)
    expect(matSpies.some((s) => s.mock.calls.length > 0)).toBe(true)

    visuals.reflection.dispose()
  })
})
