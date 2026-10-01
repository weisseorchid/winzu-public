import * as THREE from 'three'
import {
  CAMERA,
  LAYOUT,
  REF_ASPECT,
  createRuntime,
  type SceneRuntime,
} from './config'
import {
  applyScenicCamera,
  fitProjectedWidth,
  uvToWaterClamped,
} from './math/uvPlacement'

/** World positions derived from screen-space layout + scenic camera. */
export type LayoutWorld = {
  leftRock: THREE.Vector3
  lighthouse: THREE.Vector3
  midRock: THREE.Vector3
  nearRock: THREE.Vector3
  whiteBuoy: THREE.Vector3
  redBuoy: THREE.Vector3
  boat: THREE.Vector3
  pier: THREE.Vector3
  islandDock: THREE.Vector3
}

function hitOrFallback(
  camera: THREE.PerspectiveCamera,
  u: number,
  v: number,
  maxDist: number,
  fallback: THREE.Vector3,
): THREE.Vector3 {
  const hit = uvToWaterClamped(camera, u, v, maxDist)
  if (!hit) return fallback.clone()
  return hit
}

export function computeLayoutWorld(
  runtime?: Partial<SceneRuntime>,
): LayoutWorld {
  const rt = { ...createRuntime(), ...runtime }
  const camera = new THREE.PerspectiveCamera()
  applyScenicCamera(camera, {
    aspect: REF_ASPECT,
    vFov: rt.vFov,
    pitchDeg: rt.pitchDeg,
    height: rt.height,
    z: rt.cameraZ,
    lookDistance: CAMERA.lookDistance,
  })

  return {
    leftRock: hitOrFallback(
      camera,
      LAYOUT.leftRock.u,
      LAYOUT.leftRock.v,
      48,
      new THREE.Vector3(-18, 0, -35),
    ),
    lighthouse: hitOrFallback(
      camera,
      LAYOUT.lighthouse.u,
      LAYOUT.lighthouse.v,
      42,
      new THREE.Vector3(-6, 0, -38),
    ),
    midRock: hitOrFallback(
      camera,
      LAYOUT.midRock.u,
      LAYOUT.midRock.v,
      44,
      new THREE.Vector3(8, 0, -36),
    ),
    nearRock: hitOrFallback(
      camera,
      LAYOUT.nearRock.u,
      LAYOUT.nearRock.v,
      22,
      new THREE.Vector3(6, 0, -12),
    ),
    whiteBuoy: hitOrFallback(
      camera,
      LAYOUT.whiteBuoy.u,
      LAYOUT.whiteBuoy.v,
      36,
      new THREE.Vector3(-8, 0, -22),
    ),
    redBuoy: hitOrFallback(
      camera,
      LAYOUT.redBuoy.u,
      LAYOUT.redBuoy.v,
      24,
      new THREE.Vector3(4, 0, -14),
    ),
    boat: hitOrFallback(
      camera,
      LAYOUT.boat.u,
      LAYOUT.boat.v,
      14,
      new THREE.Vector3(-2, 0, 4),
    ),
    pier: hitOrFallback(
      camera,
      LAYOUT.pier.u,
      LAYOUT.pier.v,
      12,
      new THREE.Vector3(-6, 0, 6),
    ),
    islandDock: hitOrFallback(
      camera,
      LAYOUT.islandDock.u,
      LAYOUT.islandDock.v,
      36,
      new THREE.Vector3(-4, 0, -34),
    ),
  }
}

export const LAYOUT_WORLD = computeLayoutWorld()

/** Place & scale a prop so it matches the layout width fraction. */
export function placeAndFit(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  worldPos: THREE.Vector3,
  widthFrac: number,
) {
  object.position.copy(worldPos)
  object.scale.setScalar(1)
  object.updateMatrixWorld(true)
  fitProjectedWidth(camera, object, worldPos, widthFrac)
}
