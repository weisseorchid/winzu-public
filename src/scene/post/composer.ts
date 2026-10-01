import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { BLOOM, GRADE } from '../config'
import { createGradePass } from './GradePass'

export type ComposerBundle = {
  composer: EffectComposer
  bloom: UnrealBloomPass
  grade: ReturnType<typeof createGradePass>
  fxaa: ShaderPass
  setSize: (w: number, h: number, dpr: number) => void
  dispose: () => void
}

export function createComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): ComposerBundle {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(256, 256),
    BLOOM.strength,
    BLOOM.radius,
    BLOOM.threshold,
  )
  composer.addPass(bloom)

  const grade = createGradePass()
  grade.uniforms.uContrast.value = GRADE.contrast
  grade.uniforms.uSaturation.value = GRADE.saturation
  grade.uniforms.uWarmth.value = GRADE.warmth
  grade.uniforms.uVignette.value = GRADE.vignette
  composer.addPass(grade)

  const output = new OutputPass()
  composer.addPass(output)

  // FXAA last — covers composer target jaggies (canvas AA is off)
  const fxaa = new ShaderPass(FXAAShader)
  fxaa.renderToScreen = true
  composer.addPass(fxaa)

  const setSize = (w: number, h: number, dpr: number) => {
    composer.setPixelRatio(dpr)
    composer.setSize(w, h)
    bloom.resolution.set(Math.ceil(w * dpr * 0.5), Math.ceil(h * dpr * 0.5))
    const inv = fxaa.material.uniforms['resolution'] as
      { value: THREE.Vector2 } | undefined
    if (inv) inv.value.set(1 / (w * dpr), 1 / (h * dpr))
  }

  const dispose = () => {
    composer.dispose()
  }

  return { composer, bloom, grade, fxaa, setSize, dispose }
}
