import type * as THREE from 'three'
import { LAYOUT, REF_ASPECT, type SceneRuntime } from '../../../scene/config'
import { LAYOUT_WORLD, placeAndFit } from '../../../scene/layout'
import { applyScenicCamera } from '../../../scene/math/uvPlacement'
import type { BoatState } from '../../BoatController'
import type { ExteriorVisuals } from './types'

/** Initial scenic camera + placeAndFit for all exterior props. */
export function fitExteriorLayout(
  persp: THREE.PerspectiveCamera,
  visuals: ExteriorVisuals,
  boatState: BoatState,
  runtime: SceneRuntime,
  aspect: number,
): void {
  applyScenicCamera(persp, {
    aspect: aspect || REF_ASPECT,
    vFov: runtime.vFov,
    pitchDeg: runtime.pitchDeg,
    height: runtime.height,
    z: runtime.cameraZ,
  })

  placeAndFit(
    persp,
    visuals.leftRock,
    LAYOUT_WORLD.leftRock,
    LAYOUT.leftRock.width,
  )
  placeAndFit(
    persp,
    visuals.midRock,
    LAYOUT_WORLD.midRock,
    LAYOUT.midRock.width,
  )
  placeAndFit(
    persp,
    visuals.nearRock,
    LAYOUT_WORLD.nearRock,
    LAYOUT.nearRock.width,
  )
  placeAndFit(
    persp,
    visuals.lighthouse.group,
    LAYOUT_WORLD.lighthouse,
    LAYOUT.lighthouse.width,
  )
  placeAndFit(
    persp,
    visuals.whiteBuoy.group,
    LAYOUT_WORLD.whiteBuoy,
    LAYOUT.whiteBuoy.width,
  )
  placeAndFit(
    persp,
    visuals.redBuoy.group,
    LAYOUT_WORLD.redBuoy,
    LAYOUT.redBuoy.width,
  )
  placeAndFit(persp, visuals.boat.group, LAYOUT_WORLD.boat, LAYOUT.boat.width)
  placeAndFit(persp, visuals.pier.group, LAYOUT_WORLD.pier, LAYOUT.pier.width)
  placeAndFit(
    persp,
    visuals.islandDock.group,
    LAYOUT_WORLD.islandDock,
    LAYOUT.islandDock.width,
  )

  visuals.pier.group.position.y = 0
  visuals.islandDock.group.position.y = 0.05
  visuals.islandDock.group.rotation.y = 0.4

  boatState.position.set(LAYOUT_WORLD.boat.x, 0.15, LAYOUT_WORLD.boat.z)

  visuals.girl.group.position.set(
    LAYOUT_WORLD.pier.x,
    0.55,
    LAYOUT_WORLD.pier.z - 0.8,
  )
  visuals.girl.setPose('look')
}
