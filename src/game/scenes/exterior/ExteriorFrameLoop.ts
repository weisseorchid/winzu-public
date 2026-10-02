import type { Camera } from 'three'
import type { SceneId } from '../../types'
import type { BoatState } from '../../BoatController'
import type { SceneRuntime } from '../../../scene/config'
import { updateSkySun } from '../../../scene/sky/SkyDome'
import { updateSunDisc } from '../../../scene/sky/SunDisc'
import { updateLightRig } from '../../../scene/lighting/LightRig'
import { updateMountains } from '../../../scene/bg/Mountains'
import { updateClouds } from '../../../scene/bg/Clouds'
import type { ExteriorVisuals } from './types'

export type ExteriorFrameCtx = {
  t: number
  scene: SceneId
  reducedMotion: boolean
  runtime: SceneRuntime
  visuals: ExteriorVisuals
  boatState: BoatState
  camera: Camera
}

/** Scenic animation tick — boat mesh sync, props, sky/lights. No post. */
export function updateExteriorFrame(ctx: ExteriorFrameCtx): void {
  const { t, scene, reducedMotion, runtime, visuals, boatState, camera } = ctx

  visuals.boat.group.position.x = boatState.position.x
  visuals.boat.group.position.z = boatState.position.z
  visuals.boat.update(t, boatState.heading, reducedMotion)
  visuals.foam.updateWake(
    visuals.boat.group.position,
    boatState.heading + Math.PI,
  )
  visuals.whiteBuoy.update(t)
  visuals.redBuoy.update(t)
  visuals.markerTrail.update(t)
  // Ambient lantern glow (set dressing, not a game objective)
  visuals.lighthouse.update(t, true)

  if (scene === 'sail' || scene === 'dock') {
    if (visuals.girl.group.parent === visuals.boat.group) {
      visuals.girl.update(t, reducedMotion)
    }
  }

  updateSunDisc(visuals.sun, runtime.sunDir, camera)
  updateSkySun(visuals.sky, runtime.sunDir)
  updateMountains(visuals.mountains, runtime.sunDir)
  updateClouds(visuals.clouds, runtime.sunDir, runtime.fogDensity)
  updateLightRig(visuals.lights, runtime.sunDir, runtime.sunIntensity)
}
