import * as THREE from 'three'
import {
  OCEAN,
  type QualityProfile,
  type SceneRuntime,
} from '../../../scene/config'
import {
  setSunFogDensity,
  updateLightRig,
} from '../../../scene/lighting/LightRig'
import { updateSkySun } from '../../../scene/sky/SkyDome'
import { updateMountains } from '../../../scene/bg/Mountains'
import { updateClouds } from '../../../scene/bg/Clouds'
import { updateOcean } from '../../../scene/ocean/OceanMaterial'
import {
  createComposer,
  type ComposerBundle,
} from '../../../scene/post/composer'
import {
  mountCompareOverlay,
  wantsCompare,
} from '../../../scene/debug/CompareOverlay'
import { mountDebugGui, wantsDebug } from '../../../scene/debug/DebugGui'
import type { ExteriorVisuals } from './types'

export type ExteriorPost = {
  composer: ComposerBundle
  mount(opts: {
    runtime: SceneRuntime
    visuals: ExteriorVisuals
    size: { width: number; height: number }
    dprCap: number
    quality: QualityProfile
  }): void
  /** Keep resize sizing in sync when R3F size changes (no remount). */
  setSize(width: number, height: number): void
  renderFrame(opts: {
    runtime: SceneRuntime
    visuals: ExteriorVisuals
    camera: THREE.PerspectiveCamera
    size: { width: number; height: number }
    resolution: THREE.Vector2
    elapsed: number
  }): void
  dispose(visuals: ExteriorVisuals): void
}

export function createExteriorPost(
  gl: THREE.WebGLRenderer,
  threeScene: THREE.Scene,
  camera: THREE.Camera,
): ExteriorPost {
  const composer = createComposer(gl, threeScene, camera)

  let compare: ReturnType<typeof mountCompareOverlay> | null = null
  let debug: ReturnType<typeof mountDebugGui> | null = null
  let onResize: (() => void) | null = null
  let dprCap = 2
  let sizeW = 1
  let sizeH = 1
  let visualsRef: ExteriorVisuals | null = null
  let quality: QualityProfile | null = null
  let frame = 0
  let reflectionAlive = false

  const applySize = () => {
    if (!visualsRef || !quality) return
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
    composer.setSize(sizeW, sizeH, dpr)
    if (quality.reflection !== 'off') {
      visualsRef.reflection.setSize(sizeW * dpr, sizeH * dpr)
    }
  }

  const pushSceneUniforms = (
    runtime: SceneRuntime,
    visuals: ExteriorVisuals,
  ) => {
    gl.toneMappingExposure = runtime.exposure
    composer.bloom.strength = runtime.bloomStrength
    composer.bloom.threshold = runtime.bloomThreshold
    updateSkySun(visuals.sky, runtime.sunDir)
    updateMountains(visuals.mountains, runtime.sunDir)
    updateClouds(visuals.clouds, runtime.sunDir, runtime.fogDensity)
    updateLightRig(visuals.lights, runtime.sunDir, runtime.sunIntensity)
    setSunFogDensity(visuals.root, runtime.fogDensity)
    updateOcean(visuals.oceanMat, {
      sunDir: runtime.sunDir,
      time: runtime.time,
      fogDensity: runtime.fogDensity,
      reflectMap: reflectionAlive ? visuals.reflection.target.texture : null,
      waveAmp: OCEAN.amplitude,
      waveFreq: OCEAN.frequency,
      waveSpeed: OCEAN.speed,
      facetScale: OCEAN.facetScale,
    })
  }

  return {
    composer,

    mount({ runtime, visuals, size, dprCap: cap, quality: profile }) {
      // Idempotent remount: drop overlays/listeners only
      if (onResize) window.removeEventListener('resize', onResize)
      compare?.dispose()
      debug?.dispose()
      compare = null
      debug = null

      dprCap = cap
      quality = profile
      sizeW = size.width
      sizeH = size.height
      visualsRef = visuals
      frame = 0
      reflectionAlive = false

      gl.toneMapping = THREE.NeutralToneMapping
      gl.toneMappingExposure = runtime.exposure
      gl.shadowMap.enabled = false
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.autoClear = true
      gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))

      composer.bloom.enabled = profile.bloom

      const parent = gl.domElement.parentElement
      if (parent && wantsCompare()) compare = mountCompareOverlay(parent)
      if (wantsDebug()) {
        debug = mountDebugGui(runtime, {
          bloom: composer.bloom,
          onChange: () => pushSceneUniforms(runtime, visuals),
        })
      }
      pushSceneUniforms(runtime, visuals)

      onResize = () => applySize()
      applySize()
      window.addEventListener('resize', onResize)
    },

    setSize(width, height) {
      sizeW = width
      sizeH = height
      applySize()
    },

    renderFrame({
      runtime,
      visuals,
      camera: persp,
      size,
      resolution,
      elapsed,
    }) {
      const profile = quality
      let useReflect = false
      if (profile && profile.reflection !== 'off') {
        const n = Math.max(1, profile.reflectionEveryN)
        if (frame % n === 0) {
          visuals.reflection.render(gl, persp, threeScene)
          reflectionAlive = true
        }
        useReflect = reflectionAlive
      } else {
        reflectionAlive = false
      }
      frame += 1

      resolution.set(size.width, size.height)
      updateOcean(visuals.oceanMat, {
        sunDir: runtime.sunDir,
        time: elapsed,
        fogDensity: runtime.fogDensity,
        reflectMap: useReflect ? visuals.reflection.target.texture : null,
        resolution,
        waveAmp: OCEAN.amplitude,
        waveFreq: OCEAN.frequency,
        waveSpeed: OCEAN.speed,
        facetScale: OCEAN.facetScale,
      })

      composer.bloom.strength = runtime.bloomStrength
      composer.bloom.threshold = runtime.bloomThreshold
      gl.toneMappingExposure = runtime.exposure
      composer.composer.render()
    },

    dispose(visuals) {
      if (onResize) window.removeEventListener('resize', onResize)
      onResize = null
      compare?.dispose()
      debug?.dispose()
      compare = null
      debug = null
      composer.dispose()
      visuals.reflection.dispose()
      visualsRef = null
      quality = null
    },
  }
}
