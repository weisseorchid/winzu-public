import * as THREE from 'three'
import { COLORS, FOG, SUN } from '../config'

export function createLightRig(
  sunDir: THREE.Vector3,
  intensity = SUN.keyIntensity,
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'LightRig'

  const hemi = new THREE.HemisphereLight(
    SUN.hemiSky,
    SUN.hemiGround,
    SUN.hemiIntensity,
  )
  hemi.name = 'Hemi'
  group.add(hemi)

  const key = new THREE.DirectionalLight(SUN.keyColor, intensity)
  key.name = 'Key'
  key.position.copy(sunDir).multiplyScalar(40)
  key.target.position.set(0, 0, -20)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  /** shadowBias / normalBias — desk scene only; exterior has shadowMap off. */
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.04
  // Tight ortho over foreground (boat + near rock)
  const cam = key.shadow.camera
  cam.near = 1
  cam.far = 70
  cam.left = -14
  cam.right = 14
  cam.top = 14
  cam.bottom = -14
  cam.updateProjectionMatrix()
  group.add(key)
  group.add(key.target)

  return group
}

export function updateLightRig(
  group: THREE.Group,
  sunDir: THREE.Vector3,
  intensity?: number,
) {
  const key = group.getObjectByName('Key') as THREE.DirectionalLight | undefined
  if (!key) return
  key.position.copy(sunDir).multiplyScalar(40)
  if (intensity != null) key.intensity = intensity
}

type LambertOpts = {
  side?: THREE.Side
  emissive?: THREE.ColorRepresentation
  emissiveIntensity?: number
  /** Opt-in sun-aware distance fog for distant props. */
  fog?: boolean
  sunDir?: THREE.Vector3
}

export function lambertVertexColored(
  color?: THREE.ColorRepresentation,
  opts?: LambertOpts,
): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({
    color: color ?? 0xffffff,
    vertexColors: true,
    flatShading: true,
    fog: false,
    side: opts?.side ?? THREE.FrontSide,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
  })
  if (opts?.fog) {
    attachSunFog(
      mat,
      opts.sunDir ?? new THREE.Vector3(-0.5, 0.1, -0.8).normalize(),
    )
  }
  return mat
}

export function lambertFlat(
  color: THREE.ColorRepresentation,
  opts?: LambertOpts,
): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    fog: false,
    side: opts?.side ?? THREE.FrontSide,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
  })
  if (opts?.fog) {
    attachSunFog(
      mat,
      opts.sunDir ?? new THREE.Vector3(-0.5, 0.1, -0.8).normalize(),
    )
  }
  return mat
}

/** Inject shared FogExp2 (horizon-locked) into Lambert materials via onBeforeCompile. */
export function attachSunFog(
  material: THREE.MeshLambertMaterial,
  sunDir: THREE.Vector3,
): void {
  material.userData.fogDensity = material.userData.fogDensity ?? FOG.density
  material.userData.fogHeightScale = FOG.heightScale
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSunDir = { value: sunDir }
    shader.uniforms.uSkyNearSun = { value: COLORS.skyNearSun }
    shader.uniforms.uSkyTopLeft = { value: COLORS.skyTopLeft }
    shader.uniforms.uSkyTopRight = { value: COLORS.skyTopRight }
    shader.uniforms.uHorizonLeft = { value: COLORS.horizonLeft }
    shader.uniforms.uHorizonRight = { value: COLORS.horizonRight }
    shader.uniforms.uFogDensity = {
      value: (material.userData.fogDensity as number) ?? FOG.density,
    }
    shader.uniforms.uFogHeightScale = {
      value: (material.userData.fogHeightScale as number) ?? FOG.heightScale,
    }

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
uniform vec3 uSunDir;
uniform vec3 uSkyNearSun;
uniform vec3 uSkyTopLeft;
uniform vec3 uSkyTopRight;
uniform vec3 uHorizonLeft;
uniform vec3 uHorizonRight;
uniform float uFogDensity;
uniform float uFogHeightScale;
vec3 skyAtmosphereFog(vec3 dir) {
  vec3 d = normalize(dir);
  vec3 sun = normalize(uSunDir);
  float elev = d.y;
  float lr = smoothstep(-0.95, 0.95, normalize(d.xz).x);
  float sunProx = pow(max(0.0, dot(d, sun)), 4.5);
  float sunGlow = pow(max(0.0, dot(d, sun)), 12.0);
  vec3 horizon = mix(uHorizonLeft, uHorizonRight, lr);
  horizon = mix(horizon, uSkyNearSun, (sunProx * 0.22 + sunGlow * 0.12) * (1.0 - lr * 0.55));
  vec3 top = mix(uSkyTopLeft, uSkyTopRight, lr);
  float h = clamp(elev * 0.5 + 0.5, 0.0, 1.0);
  vec3 mid = mix(horizon, top, 0.55);
  vec3 col = mix(horizon, mid, smoothstep(-0.05, 0.14, elev));
  col = mix(col, top, smoothstep(0.06, 0.62, h));
  col = mix(col, uSkyNearSun, sunGlow * 0.1 * (1.0 - lr * 0.65));
  return col;
}
vec3 fogHorizonColor(vec3 viewDir) {
  vec3 d = normalize(viewDir);
  d.y = clamp(d.y, -0.02, 0.06);
  return skyAtmosphereFog(d);
}
float fogFactorExp2(float dist, float density, float worldY, float heightScale) {
  float fogFactor = 1.0 - exp(-density * density * dist * dist);
  float heightTerm = exp(-max(worldY, 0.0) * heightScale);
  return clamp(fogFactor * mix(0.55, 1.0, heightTerm), 0.0, 0.95);
}
`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <fog_fragment>',
      `
{
  float dist = length(vViewPosition);
  vec3 worldPos = (inverse(viewMatrix) * vec4(vViewPosition, 1.0)).xyz;
  float fogFactor = fogFactorExp2(dist, uFogDensity, worldPos.y, uFogHeightScale);
  vec3 worldView = normalize(cameraPosition - worldPos);
  vec3 fogCol = fogHorizonColor(-worldView);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogCol, fogFactor);
}
`,
    )
    material.userData.shader = shader
  }
  material.needsUpdate = true
}

/** Push runtime fog density into materials that used attachSunFog. */
export function setSunFogDensity(root: THREE.Object3D, density: number) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) {
      const mat = m as THREE.Material
      if (!mat) continue
      mat.userData.fogDensity = density
      const shader = mat.userData?.shader as
        { uniforms?: { uFogDensity?: { value: number } } } | undefined
      if (shader?.uniforms?.uFogDensity) {
        shader.uniforms.uFogDensity.value = density
      }
    }
  })
}
