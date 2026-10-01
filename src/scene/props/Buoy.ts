import * as THREE from 'three'
import { COLORS } from '../config'
import { lambertFlat } from '../lighting/LightRig'

export type BuoyHandle = {
  group: THREE.Group
  update: (t: number) => void
}

export function createBuoy(opts: {
  color: THREE.ColorRepresentation
  radius?: number
  seed?: number
  sunDir?: THREE.Vector3
}): BuoyHandle {
  const r = opts.radius ?? 0.35
  const group = new THREE.Group()
  group.name = 'Buoy'
  const sunDir = opts.sunDir
  const fogOpts = { fog: true as const, sunDir }

  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(r, 0),
    lambertFlat(opts.color, fogOpts),
  )
  body.position.y = r * 0.6
  group.add(body)

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, r * 2.2, 5),
    lambertFlat(COLORS.rockDark, fogOpts),
  )
  pole.position.y = r * 1.8
  group.add(pole)

  const seed = opts.seed ?? Math.random()
  const update = (t: number) => {
    group.position.y = Math.sin(t * 1.4 + seed * 6) * 0.06
    group.rotation.z = Math.sin(t * 1.1 + seed) * 0.04
  }

  return { group, update }
}
