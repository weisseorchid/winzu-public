import * as THREE from 'three'
import { COLORS, SUN } from '../config'
import { bindSkyUniforms, withSharedGlsl } from '../glsl/includes'

const vertexShader = /* glsl */ `
varying vec3 vWorldDir;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldDir = world.xyz - cameraPosition;
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  clip.z = clip.w * 0.999;
  gl_Position = clip;
}
`

const fragmentShader = withSharedGlsl(
  /* glsl */ `
varying vec3 vWorldDir;
void main() {
  vec3 dir = normalize(vWorldDir);
  vec3 col = skyColor(dir);
  gl_FragColor = vec4(col, 1.0);
}
`,
  { sky: true },
)

export function createSkyDome(sunDir: THREE.Vector3): THREE.Mesh {
  const geo = new THREE.SphereGeometry(160, 48, 28)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      uSunDir: { value: sunDir },
      uSkyNearSun: { value: COLORS.skyNearSun },
      uSkyTopLeft: { value: COLORS.skyTopLeft },
      uSkyTopRight: { value: COLORS.skyTopRight },
      uHorizonLeft: { value: COLORS.horizonLeft },
      uHorizonRight: { value: COLORS.horizonRight },
      uSunHdr: { value: SUN.hdr },
      uSunGlow: { value: SUN.glow },
      uSunCoreColor: { value: SUN.coreColor.clone() },
      uSunCoreGold: { value: SUN.coreGold.clone() },
    },
    vertexShader,
    fragmentShader,
  })
  bindSkyUniforms(mat.uniforms, sunDir, COLORS, SUN.hdr, {
    glow: SUN.glow,
    coreColor: SUN.coreColor,
    coreGold: SUN.coreGold,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.renderOrder = -100
  mesh.frustumCulled = false
  mesh.name = 'SkyDome'
  return mesh
}

export function updateSkySun(mesh: THREE.Mesh, sunDir: THREE.Vector3) {
  const mat = mesh.material as THREE.ShaderMaterial
  mat.uniforms.uSunDir.value.copy(sunDir)
}
