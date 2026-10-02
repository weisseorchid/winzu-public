import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { findDeskId, resolveDeskIntent } from './DeskPicker'

describe('resolveDeskIntent', () => {
  it('maps map mesh to map intent', () => {
    expect(resolveDeskIntent('map')).toEqual({ kind: 'map' })
  })

  it('maps all document props to doc intents', () => {
    for (const docId of [
      'letter_burn',
      'letter_renewal',
      'letter_copy',
      'book',
    ] as const) {
      expect(resolveDeskIntent(docId)).toEqual({ kind: 'doc', docId })
    }
  })

  it('ignores decorative and unknown props', () => {
    expect(resolveDeskIntent('globe')).toEqual({ kind: 'ignore' })
    expect(resolveDeskIntent('plant')).toEqual({ kind: 'ignore' })
    expect(resolveDeskIntent('chair')).toEqual({ kind: 'ignore' })
    expect(resolveDeskIntent('not_a_prop')).toEqual({ kind: 'ignore' })
  })
})

describe('findDeskId', () => {
  it('returns null for null or unknown objects', () => {
    expect(findDeskId(null)).toBeNull()
    expect(findDeskId(new THREE.Object3D())).toBeNull()
    const unknown = new THREE.Object3D()
    unknown.name = 'mystery'
    unknown.userData.deskId = 'mystery'
    expect(findDeskId(unknown)).toBeNull()
  })

  it('reads deskId from userData on the hit object', () => {
    const mesh = new THREE.Object3D()
    mesh.userData.deskId = 'map'
    expect(findDeskId(mesh)).toBe('map')
  })

  it('falls back to object name when userData is absent', () => {
    const mesh = new THREE.Object3D()
    mesh.name = 'letter_burn'
    expect(findDeskId(mesh)).toBe('letter_burn')
  })

  it('walks parents until a known id is found', () => {
    const root = new THREE.Object3D()
    root.userData.deskId = 'book'
    const child = new THREE.Object3D()
    root.add(child)
    const leaf = new THREE.Object3D()
    child.add(leaf)
    expect(findDeskId(leaf)).toBe('book')
  })

  it('prefers userData over name on the same object', () => {
    const mesh = new THREE.Object3D()
    mesh.name = 'globe'
    mesh.userData.deskId = 'map'
    expect(findDeskId(mesh)).toBe('map')
  })
})
