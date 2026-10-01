import * as THREE from 'three'

/**
 * Sun plate is drawn in the skydome shader (hard cream disc).
 * This empty group keeps a world-space sun position for tooling / future props.
 */
export function createSunDisc(
  sunDir: THREE.Vector3,
  distance = 90,
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'SunDisc'
  group.visible = false
  group.frustumCulled = false
  group.position.copy(sunDir).normalize().multiplyScalar(distance)
  return group
}

export function updateSunDisc(
  group: THREE.Group,
  sunDir: THREE.Vector3,
  _camera: THREE.Camera,
  distance = 90,
) {
  group.position.copy(sunDir).normalize().multiplyScalar(distance)
}
