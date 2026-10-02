import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { COLORS } from '../config'
import { disposeObject3D } from '../dispose'

export type FoamSystem = {
  group: THREE.Group
  wake: THREE.Group
  updateWake: (boatPos: THREE.Vector3, heading: number) => void
  dispose: () => void
}

const foamMatCache = new Map<number, THREE.MeshBasicMaterial>()

function foamMat(opacity = 0.85) {
  const key = Math.round(opacity * 100)
  let mat = foamMatCache.get(key)
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      color: COLORS.foam,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
      toneMapped: true,
    })
    foamMatCache.set(key, mat)
  }
  return mat
}

/** Drop shared foam materials after a scenic dispose so remounts allocate fresh GPU state. */
export function clearFoamMatCache(): void {
  for (const mat of foamMatCache.values()) mat.dispose()
  foamMatCache.clear()
}

export function createFoamRing(radius: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(radius * 0.88, radius, 16)
  const mesh = new THREE.Mesh(geo, foamMat(0.35))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.015
  mesh.renderOrder = 2
  return mesh
}

/** One merged mesh of waterline patches around a rock/island footprint. */
export function createWaterlineFoam(radius: number, count = 8): THREE.Mesh {
  const mat = foamMat(0.28)
  const geos: THREE.BufferGeometry[] = []
  const matrix = new THREE.Matrix4()
  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-Math.PI / 2, 0, 0),
  )
  const scale = new THREE.Vector3(1, 1, 1)

  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const w = 0.32 + (i % 3) * 0.06
    const geo = new THREE.PlaneGeometry(w, 0.08)
    pos.set(Math.cos(a) * radius, 0.018, Math.sin(a) * radius)
    matrix.compose(pos, quat, scale)
    geo.applyMatrix4(matrix)
    geos.push(geo)
  }

  const merged = mergeGeometries(geos, false)
  for (const g of geos) g.dispose()
  const mesh = new THREE.Mesh(merged ?? new THREE.BufferGeometry(), mat)
  mesh.renderOrder = 2
  mesh.name = 'WaterlineFoam'
  return mesh
}

export function createFoamSystem(): FoamSystem {
  const group = new THREE.Group()
  group.name = 'Foam'

  const wake = new THREE.Group()
  wake.name = 'Wake'
  // Soft translucent wake wedges — paint-like, not solid blocks
  for (let i = 0; i < 6; i++) {
    const w = 0.22 + i * 0.1
    const d = 0.26 + i * 0.12
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      foamMat(0.32 - i * 0.04),
    )
    m.rotation.x = -Math.PI / 2
    const side = i % 2 === 0 ? 1 : -1
    m.position.set(side * (0.09 + i * 0.055), 0.02, 0.5 + i * 0.3)
    m.rotation.z = side * 0.22
    m.renderOrder = 3
    wake.add(m)
  }
  const stern = new THREE.Mesh(new THREE.CircleGeometry(0.26, 8), foamMat(0.38))
  stern.rotation.x = -Math.PI / 2
  stern.position.set(0, 0.018, 0.7)
  stern.renderOrder = 3
  wake.add(stern)

  group.add(wake)

  const updateWake = (boatPos: THREE.Vector3, heading: number) => {
    wake.position.copy(boatPos)
    wake.position.y = 0.015
    wake.rotation.y = heading
  }

  const dispose = () => {
    disposeObject3D(group)
    clearFoamMatCache()
  }

  return { group, wake, updateWake, dispose }
}
