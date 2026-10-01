import * as THREE from 'three'
import { COLORS, FOG } from '../config'
import { bindSkyUniforms, withSharedGlsl } from '../glsl/includes'

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = withSharedGlsl(
  /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
uniform float uOpacity;

void main() {
  vec3 viewDir = normalize(vWorldPos - cameraPosition);
  vec3 flatDir = normalize(vec3(viewDir.x, 0.0, viewDir.z));
  vec3 col = skyAtmosphere(flatDir);
  col = mix(col, fogHorizonColor(flatDir), 0.4);

  // Soft low haze only — no hard top edge (that read as a second horizon)
  float bottom = smoothstep(0.0, 0.08, vUv.y);
  float top = 1.0 - smoothstep(0.25, 1.0, vUv.y);
  float band = pow(bottom * top, 1.15);
  float fade = band * uOpacity * 0.42;

  gl_FragColor = vec4(col, fade);
}
`,
  { sky: true },
)

/**
 * Soft horizon haze over mountain feet.
 * Keep it thin and soft-topped so it doesn't paint a second waterline.
 */
export function createHorizonMist(sunDir: THREE.Vector3): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(400, 18, 1, 1)
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    fog: false,
    side: THREE.DoubleSide,
    uniforms: {
      uSunDir: { value: sunDir.clone() },
      uSkyNearSun: { value: COLORS.skyNearSun },
      uSkyTopLeft: { value: COLORS.skyTopLeft },
      uSkyTopRight: { value: COLORS.skyTopRight },
      uHorizonLeft: { value: COLORS.horizonLeft },
      uHorizonRight: { value: COLORS.horizonRight },
      uSunHdr: { value: 6.5 },
      uMistBand: { value: FOG.mistBandPx },
      uOpacity: { value: 1 },
    },
    vertexShader,
    fragmentShader,
  })
  bindSkyUniforms(mat.uniforms, sunDir, COLORS)
  const mesh = new THREE.Mesh(geo, mat)
  // Low wall just above water, in front of mountain bands
  mesh.position.set(0, 7.5, -100)
  mesh.renderOrder = -50
  mesh.frustumCulled = false
  mesh.name = 'HorizonMist'
  return mesh
}

export function updateHorizonMist(mesh: THREE.Mesh, sunDir: THREE.Vector3) {
  const mat = mesh.material as THREE.ShaderMaterial
  mat.uniforms.uSunDir.value.copy(sunDir)
}
