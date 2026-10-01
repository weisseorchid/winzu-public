import * as THREE from 'three'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GRADE } from '../config'

const GradeShader = {
  name: 'GradeShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uContrast: { value: GRADE.contrast },
    uSaturation: { value: GRADE.saturation },
    uWarmth: { value: GRADE.warmth },
    uVignette: { value: GRADE.vignette },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uWarmth;
    uniform float uVignette;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 c = tex.rgb;
      c = (c - 0.5) * uContrast + 0.5;
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(luma), c, uSaturation);
      // Warm midtones only — leave bright sky cool (avoids muddy beige wash)
      float warmMask =
        smoothstep(0.14, 0.32, luma) * (1.0 - smoothstep(0.48, 0.78, luma));
      c.r += uWarmth * warmMask;
      c.b -= uWarmth * 0.45 * warmMask;
      float d = distance(vUv, vec2(0.5));
      float vig = smoothstep(0.85, 0.25, d);
      c *= mix(1.0, vig, uVignette);
      gl_FragColor = vec4(c, tex.a);
    }
  `,
}

export function createGradePass(): ShaderPass {
  return new ShaderPass(GradeShader)
}
