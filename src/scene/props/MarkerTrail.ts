import * as THREE from 'three'
import { COLORS } from '../config'
import { lambertFlat } from '../lighting/LightRig'

export type MarkerTrailHandle = {
  group: THREE.Group
  update: (t: number) => void
}

/**
 * Instanced floating markers (red octahedra + thin white poles).
 * One draw call pair instead of N separate buoy meshes.
 */
export function createMarkerTrail(
  positions: ReadonlyArray<readonly [number, number, number]>,
): MarkerTrailHandle {
  const group = new THREE.Group()
  group.name = 'MarkerTrail'
  const count = positions.length

  const bodyGeo = new THREE.OctahedronGeometry(0.42, 0)
  const bodyMat = lambertFlat(COLORS.buoyRed, { fog: true })
  const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, count)
  bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  bodies.castShadow = false

  const poleGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.9, 5)
  const poleMat = lambertFlat(COLORS.buoyWhite, { fog: true })
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, count)
  poles.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const pos = positions[i]!
    const scale = i % 2 === 0 ? 1 : 0.72
    dummy.position.set(pos[0], 0.35 * scale, pos[2])
    dummy.scale.setScalar(scale)
    dummy.rotation.set(0, (i * 0.7) % Math.PI, 0)
    dummy.updateMatrix()
    bodies.setMatrixAt(i, dummy.matrix)

    dummy.position.set(pos[0], 0.55 * scale, pos[2])
    dummy.scale.set(1, scale, 1)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    poles.setMatrixAt(i, dummy.matrix)
  }
  bodies.instanceMatrix.needsUpdate = true
  poles.instanceMatrix.needsUpdate = true

  group.add(bodies, poles)

  return {
    group,
    update(t) {
      for (let i = 0; i < count; i++) {
        const pos = positions[i]!
        const scale = i % 2 === 0 ? 1 : 0.72
        const bob = Math.sin(t * 1.4 + i * 0.9) * 0.06
        dummy.position.set(pos[0], 0.35 * scale + bob, pos[2])
        dummy.scale.setScalar(scale)
        dummy.rotation.set(0, t * 0.15 + i, Math.sin(t + i) * 0.08)
        dummy.updateMatrix()
        bodies.setMatrixAt(i, dummy.matrix)

        dummy.position.set(pos[0], 0.55 * scale + bob, pos[2])
        dummy.scale.set(1, scale, 1)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        poles.setMatrixAt(i, dummy.matrix)
      }
      bodies.instanceMatrix.needsUpdate = true
      poles.instanceMatrix.needsUpdate = true
    },
  }
}
