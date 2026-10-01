import * as THREE from 'three'
import { COLORS } from '../config'

export type FoamSystem = {
  group: THREE.Group
  wake: THREE.Group
  updateWake: (boatPos: THREE.Vector3, heading: number) => void
}

function foamMat(opacity = 0.85) {
  return new THREE.MeshBasicMaterial({
    color: COLORS.foam,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: false,
    toneMapped: true,
  })
}

export function createFoamRing(radius: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(radius * 0.88, radius, 16)
  const mesh = new THREE.Mesh(geo, foamMat(0.35))
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.015
  mesh.renderOrder = 2
  return mesh
}

export function createWaterlineFoam(radius: number, count = 8): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32 + (i % 3) * 0.06, 0.08),
      foamMat(0.28),
    )
    m.rotation.x = -Math.PI / 2
    m.position.set(Math.cos(a) * radius, 0.018, Math.sin(a) * radius)
    m.renderOrder = 2
    g.add(m)
  }
  return g
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

  return { group, wake, updateWake }
}
