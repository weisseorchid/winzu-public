import * as THREE from 'three'
import { CAMERA } from '../config'

const _ndc = new THREE.Vector3()
const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _right = new THREE.Vector3()
const _tmp = new THREE.Vector3()

/**
 * Cast a screen UV (u right, v from top) through the camera onto the y=0 plane.
 * Returns null if the ray misses (looks at the sky).
 */
export function uvToWater(
  camera: THREE.PerspectiveCamera,
  u: number,
  v: number,
  out = new THREE.Vector3(),
): THREE.Vector3 | null {
  // NDC: x [-1,1], y [1,-1] with v from top
  _ndc.set(u * 2 - 1, 1 - v * 2, 0.5)
  _ndc.unproject(camera)
  _origin.copy(camera.position)
  _dir.copy(_ndc).sub(_origin).normalize()
  if (Math.abs(_dir.y) < 1e-5) return null
  const t = -_origin.y / _dir.y
  if (t <= 0) return null
  return out.copy(_origin).addScaledVector(_dir, t)
}

/** Apply scenic camera pose from config/runtime. */
export function applyScenicCamera(
  camera: THREE.PerspectiveCamera,
  opts: {
    aspect: number
    vFov: number
    pitchDeg: number
    height: number
    z: number
    lookDistance?: number
  },
) {
  camera.aspect = opts.aspect
  camera.fov = opts.vFov
  camera.near = CAMERA.near
  camera.far = CAMERA.far
  camera.position.set(0, opts.height, opts.z)
  const pitch = THREE.MathUtils.degToRad(opts.pitchDeg)
  const dist = opts.lookDistance ?? CAMERA.lookDistance
  const look = new THREE.Vector3(
    0,
    opts.height + Math.sin(pitch) * dist,
    opts.z - Math.cos(pitch) * dist,
  )
  camera.up.set(0, 1, 0)
  camera.lookAt(look)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
}

/**
 * Uniformly scale an Object3D so its axis-aligned world width projects to
 * roughly `widthFrac` of the frame width at the object's position.
 */
export function fitProjectedWidth(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  worldPos: THREE.Vector3,
  widthFrac: number,
  sampleRadius = 1,
) {
  object.position.copy(worldPos)
  object.updateMatrixWorld(true)

  const dist = camera.position.distanceTo(worldPos)
  const vFov = THREE.MathUtils.degToRad(camera.fov)
  const worldHeight = 2 * Math.tan(vFov / 2) * dist
  const worldWidth = worldHeight * camera.aspect
  const targetWorldWidth = worldWidth * widthFrac

  // Measure current local width along camera right
  camera.getWorldDirection(_dir)
  _right.crossVectors(camera.up, _dir).normalize()
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(_tmp)
  const current = Math.max(size.x, size.z, sampleRadius * 2)
  if (current < 1e-5) return
  const s = targetWorldWidth / current
  object.scale.setScalar(object.scale.x * s)
}

/** Clamp far water hits so tiny UV wobble near the horizon doesn't explode. */
export function clampWaterHit(
  hit: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  maxDist = 120,
): THREE.Vector3 {
  const d = camera.position.distanceTo(hit)
  if (d <= maxDist) return hit
  _dir.copy(hit).sub(camera.position).normalize()
  return hit.copy(camera.position).addScaledVector(_dir, maxDist)
}

/**
 * Place on the UV ray but clamp distance so midground props stay readable
 * (horizon UVs are extremely depth-sensitive).
 */
export function uvToWaterClamped(
  camera: THREE.PerspectiveCamera,
  u: number,
  v: number,
  maxDist: number,
  out = new THREE.Vector3(),
): THREE.Vector3 | null {
  const hit = uvToWater(camera, u, v, out)
  if (!hit) return null
  return clampWaterHit(hit, camera, maxDist)
}
