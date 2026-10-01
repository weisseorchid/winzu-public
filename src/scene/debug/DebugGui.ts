import GUI from 'lil-gui'
import * as THREE from 'three'
import type { SceneRuntime } from '../config'
import { BLOOM, CAMERA, FOG, GRADE, OCEAN, SUN, SUN_DIR } from '../config'

export type DebugHandles = {
  gui: GUI
  dispose: () => void
}

export function mountDebugGui(
  runtime: SceneRuntime,
  opts: {
    onChange: () => void
    bloom?: { strength: number; threshold: number }
  },
): DebugHandles {
  const gui = new GUI({ title: 'Winzu Scene' })
  const sun = { azimuth: 30, elevation: 4.5 }
  // Derive az/el from sun dir
  {
    const d = runtime.sunDir
    sun.elevation = THREE.MathUtils.radToDeg(
      Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)),
    )
    sun.azimuth = THREE.MathUtils.radToDeg(Math.atan2(-d.x, -d.z))
  }

  const applySun = () => {
    const el = THREE.MathUtils.degToRad(sun.elevation)
    const az = THREE.MathUtils.degToRad(sun.azimuth)
    runtime.sunDir
      .set(
        -Math.sin(az) * Math.cos(el),
        Math.sin(el),
        -Math.cos(az) * Math.cos(el),
      )
      .normalize()
    opts.onChange()
  }

  const fSun = gui.addFolder('Sun')
  fSun.add(sun, 'azimuth', -60, 60, 0.5).onChange(applySun)
  fSun.add(sun, 'elevation', 0, 25, 0.1).onChange(applySun)
  fSun
    .add(runtime, 'sunIntensity', 0.2, 3, 0.05)
    .name('intensity')
    .onChange(opts.onChange)

  const fCam = gui.addFolder('Camera')
  fCam.add(runtime, 'vFov', 30, 70, 0.5).onChange(opts.onChange)
  fCam
    .add(runtime, 'pitchDeg', -20, 5, 0.1)
    .name('pitch')
    .onChange(opts.onChange)
  fCam.add(runtime, 'height', 1, 12, 0.1).onChange(opts.onChange)
  fCam.add(runtime, 'cameraZ', 4, 40, 0.1).name('z').onChange(opts.onChange)

  const fFog = gui.addFolder('Fog')
  fFog.add(runtime, 'fogDensity', 0, 0.06, 0.001).onChange(opts.onChange)

  const fOcean = gui.addFolder('Ocean')
  fOcean.add(OCEAN, 'amplitude', 0, 0.4, 0.01).onChange(opts.onChange)
  fOcean.add(OCEAN, 'frequency', 0.02, 0.25, 0.005).onChange(opts.onChange)
  fOcean.add(OCEAN, 'speed', 0, 2, 0.05).onChange(opts.onChange)
  fOcean.add(OCEAN, 'facetScale', 1, 8, 0.1).onChange(opts.onChange)

  const fPost = gui.addFolder('Post')
  fPost.add(runtime, 'bloomStrength', 0, 1, 0.01).onChange(() => {
    if (opts.bloom) opts.bloom.strength = runtime.bloomStrength
    opts.onChange()
  })
  fPost.add(runtime, 'bloomThreshold', 0.4, 3, 0.01).onChange(() => {
    if (opts.bloom) opts.bloom.threshold = runtime.bloomThreshold
    opts.onChange()
  })
  fPost.add(runtime, 'exposure', 0.4, 2, 0.01).onChange(opts.onChange)

  const oceanDefaults = {
    amplitude: OCEAN.amplitude,
    frequency: OCEAN.frequency,
    speed: OCEAN.speed,
    facetScale: OCEAN.facetScale,
  }

  gui
    .add(
      {
        reset: () => {
          runtime.sunDir.copy(SUN_DIR)
          runtime.vFov = CAMERA.vFov
          runtime.pitchDeg = CAMERA.pitchDeg
          runtime.height = CAMERA.height
          runtime.cameraZ = CAMERA.z
          runtime.fogDensity = FOG.density
          runtime.bloomStrength = BLOOM.strength
          runtime.bloomThreshold = BLOOM.threshold
          runtime.sunIntensity = SUN.keyIntensity
          runtime.exposure = GRADE.exposure
          OCEAN.amplitude = oceanDefaults.amplitude
          OCEAN.frequency = oceanDefaults.frequency
          OCEAN.speed = oceanDefaults.speed
          OCEAN.facetScale = oceanDefaults.facetScale
          opts.onChange()
          gui.controllersRecursive().forEach((c) => c.updateDisplay())
        },
      },
      'reset',
    )
    .name('Reset defaults')

  return {
    gui,
    dispose: () => gui.destroy(),
  }
}

export function wantsDebug(): boolean {
  return new URLSearchParams(location.search).has('debug')
}
