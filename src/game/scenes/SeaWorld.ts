import * as THREE from 'three'
import {
  COLORS,
  type QualityProfile,
  type SceneRuntime,
} from '../../scene/config'
import { LAYOUT_WORLD } from '../../scene/layout'
import { disposeObject3D } from '../../scene/dispose'
import { createSkyDome } from '../../scene/sky/SkyDome'
import { createSunDisc } from '../../scene/sky/SunDisc'
import {
  createOceanMaterial,
  createOceanMesh,
} from '../../scene/ocean/OceanMaterial'
import { createLightRig } from '../../scene/lighting/LightRig'
import { createMountains } from '../../scene/bg/Mountains'
import { createClouds, disposeClouds } from '../../scene/bg/Clouds'
import { createRock } from '../../scene/props/Rock'
import { createBuoy } from '../../scene/props/Buoy'
import { createLighthouse } from '../../scene/props/Lighthouse'
import { createBoat, type BoatHandle } from '../../scene/props/Boat'
import {
  createFoamRing,
  createFoamSystem,
  createWaterlineFoam,
  type FoamSystem,
} from '../../scene/foam/Foam'
import {
  createPier,
  createIslandDock,
  type PierHandle,
} from '../../scene/props/Pier'
import { createGirl, type GirlHandle } from '../../scene/props/Girl'
import {
  createMarkerTrail,
  type MarkerTrailHandle,
} from '../../scene/props/MarkerTrail'
import { createReflectionPass } from '../../scene/reflect/ReflectionPass'
import { MARKER_POSITIONS } from '../BoatController'

export type SeaWorldVisuals = {
  root: THREE.Group
  lights: THREE.Group
  sky: THREE.Mesh
  sun: THREE.Group
  ocean: THREE.Mesh
  leftRock: THREE.Mesh
  midRock: THREE.Mesh
  nearRock: THREE.Mesh
  lighthouse: ReturnType<typeof createLighthouse>
  whiteBuoy: ReturnType<typeof createBuoy>
  redBuoy: ReturnType<typeof createBuoy>
  markerTrail: MarkerTrailHandle
  boat: BoatHandle
  foam: FoamSystem
  mountains: THREE.Group
  clouds: THREE.Group
  pier: PierHandle
  islandDock: PierHandle
  girl: GirlHandle
  oceanMat: THREE.ShaderMaterial
  reflection: ReturnType<typeof createReflectionPass>
}

/** Build the shared exterior scenic graph (Scenes 0–2). */
export function createSeaWorld(
  runtime: SceneRuntime,
  quality: QualityProfile,
): SeaWorldVisuals {
  const sunDir = runtime.sunDir
  const root = new THREE.Group()
  root.name = 'ScenicRoot'

  const oceanMat = createOceanMaterial(sunDir)
  const reflection = createReflectionPass(quality.reflectionHalfRes)

  const lights = createLightRig(sunDir, runtime.sunIntensity)
  const sky = createSkyDome(sunDir, quality.skyWidthSegs, quality.skyHeightSegs)
  const sun = createSunDisc(sunDir)
  const mountains = createMountains(sunDir)
  const clouds = createClouds(sunDir)
  const ocean = createOceanMesh(oceanMat, quality.oceanSegments)

  const leftRock = createRock({ radius: 2.2, seed: 1.1, sunDir, fog: true })
  const midRock = createRock({ radius: 1.9, seed: 2.4, sunDir, fog: true })
  const nearRock = createRock({ radius: 2.6, seed: 3.7, sunDir, fog: true })
  nearRock.castShadow = true
  nearRock.receiveShadow = true
  const lighthouse = createLighthouse(sunDir)
  const whiteBuoy = createBuoy({
    color: COLORS.buoyWhite,
    radius: 0.28,
    seed: 1,
    sunDir,
  })
  const redBuoy = createBuoy({
    color: COLORS.buoyRed,
    radius: 0.45,
    seed: 2,
    sunDir,
  })
  const markerTrail = createMarkerTrail(MARKER_POSITIONS)

  const boat = createBoat()
  boat.group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
  const foam = createFoamSystem()
  const pier = createPier()
  const islandDock = createIslandDock()
  const girl = createGirl()

  reflection.trackHidden(lights, sky, sun, mountains, clouds, ocean, foam.group)

  root.add(
    lights,
    sky,
    sun,
    mountains,
    clouds,
    ocean,
    leftRock,
    midRock,
    nearRock,
    lighthouse.group,
    whiteBuoy.group,
    redBuoy.group,
    markerTrail.group,
    boat.group,
    foam.group,
    pier.group,
    islandDock.group,
    girl.group,
  )

  const lf = createWaterlineFoam(2.8)
  lf.position.copy(LAYOUT_WORLD.leftRock)
  const mf = createWaterlineFoam(2.2)
  mf.position.copy(LAYOUT_WORLD.midRock)
  const nf = createWaterlineFoam(3.0)
  nf.position.copy(LAYOUT_WORLD.nearRock)
  const islandFoam = createWaterlineFoam(3.4, 10)
  islandFoam.position.copy(LAYOUT_WORLD.lighthouse)
  const wbRing = createFoamRing(0.55)
  wbRing.position.copy(LAYOUT_WORLD.whiteBuoy)
  const rbRing = createFoamRing(0.75)
  rbRing.position.copy(LAYOUT_WORLD.redBuoy)
  foam.group.add(lf, mf, nf, islandFoam, wbRing, rbRing)

  return {
    root,
    lights,
    sky,
    sun,
    ocean,
    leftRock,
    midRock,
    nearRock,
    lighthouse,
    whiteBuoy,
    redBuoy,
    markerTrail,
    boat,
    foam,
    mountains,
    clouds,
    pier,
    islandDock,
    girl,
    oceanMat,
    reflection,
  }
}

/**
 * Tear down the exterior scenic graph (geometries, materials, textures, shadow maps).
 * Reflection RT is owned by ExteriorPost — dispose that separately.
 */
export function disposeSeaWorld(visuals: SeaWorldVisuals): void {
  visuals.root.removeFromParent()

  // Detach handle-owned subtrees so each dispose owns its resources exclusively.
  visuals.root.remove(visuals.foam.group)
  visuals.root.remove(visuals.clouds)
  visuals.root.remove(visuals.boat.group)

  visuals.foam.dispose()
  disposeClouds(visuals.clouds)
  visuals.boat.dispose()
  disposeObject3D(visuals.root)
  visuals.root.clear()
}
