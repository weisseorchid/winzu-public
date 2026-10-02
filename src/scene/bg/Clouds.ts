import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { COLORS, FOG } from '../config'
import { disposeObject3D } from '../dispose'
import { bindSkyUniforms, withSharedGlsl } from '../glsl/includes'

type Lobe = {
  o: [number, number, number]
  s: [number, number, number]
  yaw?: number
}

type Bank = {
  p: [number, number, number]
  scale: number
  /** 0 = cool bank, 1 = sun-warmed peach. */
  warmth: number
  lobes: Lobe[]
}

/**
 * Distant horizon haze banks — low, far, flat, sitting with the mountain range.
 * Keep a soft pocket around the sun disc (upper-left).
 */
const BANKS: Bank[] = [
  {
    p: [-18, 14, -148],
    scale: 14,
    warmth: 0.85,
    lobes: [
      { o: [0, 0, 0], s: [2.2, 0.55, 1.4] },
      { o: [1.6, 0.05, 0.2], s: [1.5, 0.45, 1.1] },
      { o: [-1.7, 0.02, -0.15], s: [1.55, 0.42, 1.05] },
      { o: [0.3, 0.28, -0.1], s: [1.2, 0.4, 0.9] },
      { o: [0.8, -0.15, 0.35], s: [1.6, 0.32, 1.15] },
      { o: [-0.6, 0.18, 0.3], s: [1.0, 0.38, 0.85] },
    ],
  },
  {
    p: [-42, 12, -162],
    scale: 11,
    warmth: 0.7,
    lobes: [
      { o: [0, 0, 0], s: [1.9, 0.5, 1.25] },
      { o: [1.3, 0.06, 0.1], s: [1.2, 0.4, 0.95] },
      { o: [-1.25, 0.04, -0.1], s: [1.25, 0.38, 1.0] },
      { o: [0.2, 0.22, -0.15], s: [0.95, 0.36, 0.8] },
      { o: [0.5, -0.12, 0.25], s: [1.35, 0.28, 1.05] },
    ],
  },
  {
    p: [12, 15, -155],
    scale: 18,
    warmth: 0.35,
    lobes: [
      { o: [0, 0, 0], s: [2.6, 0.58, 1.55] },
      { o: [2.1, 0.08, 0.15], s: [1.7, 0.48, 1.2] },
      { o: [-2.2, 0.06, 0.05], s: [1.8, 0.5, 1.25] },
      { o: [0.25, 0.32, -0.15], s: [1.5, 0.42, 1.05] },
      { o: [0.9, -0.18, 0.4], s: [1.9, 0.3, 1.3] },
      { o: [-1.0, 0.2, 0.35], s: [1.3, 0.4, 1.0] },
      { o: [3.2, 0.1, -0.2], s: [1.25, 0.42, 0.95] },
      { o: [-3.1, 0.12, -0.15], s: [1.2, 0.44, 0.9] },
    ],
  },
  {
    p: [38, 13, -168],
    scale: 15,
    warmth: 0.18,
    lobes: [
      { o: [0, 0, 0], s: [2.3, 0.52, 1.35] },
      { o: [1.8, 0.08, -0.1], s: [1.5, 0.42, 1.05] },
      { o: [-1.75, 0.06, 0.12], s: [1.55, 0.44, 1.1] },
      { o: [0.15, 0.26, -0.15], s: [1.3, 0.4, 0.95] },
      { o: [0.7, -0.14, 0.35], s: [1.7, 0.28, 1.15] },
      { o: [2.6, 0.12, 0.1], s: [1.1, 0.38, 0.85] },
      { o: [-0.8, 0.18, 0.3], s: [1.15, 0.36, 0.9] },
    ],
  },
  {
    p: [58, 11, -178],
    scale: 12,
    warmth: 0.08,
    lobes: [
      { o: [0, 0, 0], s: [2.0, 0.48, 1.2] },
      { o: [1.4, 0.05, 0.08], s: [1.25, 0.38, 0.9] },
      { o: [-1.35, 0.04, -0.08], s: [1.3, 0.36, 0.95] },
      { o: [0.2, 0.2, -0.12], s: [1.05, 0.34, 0.8] },
      { o: [0.55, -0.1, 0.28], s: [1.4, 0.26, 1.0] },
    ],
  },
  {
    p: [-55, 11, -172],
    scale: 10,
    warmth: 0.55,
    lobes: [
      { o: [0, 0, 0], s: [1.8, 0.46, 1.15] },
      { o: [1.2, 0.04, 0.1], s: [1.15, 0.36, 0.85] },
      { o: [-1.15, 0.03, -0.08], s: [1.2, 0.34, 0.9] },
      { o: [0.15, 0.18, -0.1], s: [0.9, 0.32, 0.75] },
    ],
  },
]

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()
const _ab = new THREE.Vector3()
const _ac = new THREE.Vector3()
const _n = new THREE.Vector3()
const _face = new THREE.Color()

function palette(warmth: number) {
  return {
    // Muted horizon haze — close to sky so banks dissolve into mist
    shadow: new THREE.Color('#7A8498').lerp(new THREE.Color('#A89080'), warmth),
    lit: new THREE.Color('#9AA4B4').lerp(new THREE.Color('#D4B8A0'), warmth),
    hi: new THREE.Color('#B0B8C4').lerp(new THREE.Color('#E8C8A8'), warmth),
  }
}

/** Flat-shaded lobe with baked sun-facing peach / cool shadow colors. */
function buildLobe(
  sunDir: THREE.Vector3,
  warmth: number,
  scale: [number, number, number],
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 1).toNonIndexed()
  const pos = geo.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // Flatten into soft horizon pillows
    const yScale = y < 0 ? 0.38 : 0.52
    const n = 0.96 + 0.05 * Math.sin(x * 1.8 + z * 1.4 + y * 2.0)
    pos.setXYZ(i, x * n, y * yScale * n, z * n)
  }

  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) * scale[0],
      pos.getY(i) * scale[1],
      pos.getZ(i) * scale[2],
    )
  }
  pos.needsUpdate = true

  const { shadow, lit, hi } = palette(warmth)
  const colors = new Float32Array(pos.count * 3)

  for (let i = 0; i < pos.count; i += 3) {
    _a.fromBufferAttribute(pos, i)
    _b.fromBufferAttribute(pos, i + 1)
    _c.fromBufferAttribute(pos, i + 2)
    _ab.subVectors(_b, _a)
    _ac.subVectors(_c, _a)
    _n.crossVectors(_ab, _ac).normalize()

    const ndl = _n.dot(sunDir)
    const wrap = THREE.MathUtils.clamp(ndl * 0.4 + 0.45, 0, 1)
    const band = Math.floor(wrap * 3.0 + 0.2) / 3.0
    _face.copy(shadow).lerp(lit, THREE.MathUtils.clamp(band * 0.7 + 0.25, 0, 1))
    if (_n.y > 0.2) _face.lerp(hi, (_n.y - 0.2) * (0.35 + warmth * 0.2))
    if (_n.y < -0.15) _face.lerp(shadow, (-_n.y - 0.15) * 0.35)
    if (ndl > 0.35) _face.lerp(hi, (ndl - 0.35) * 0.4)
    // Subtle sun-side lift only — keep banks foggy, not bright cushions
    if (ndl > 0.15 && warmth > 0.45) {
      _face.lerp(new THREE.Color('#E8C8A8'), (ndl - 0.15) * warmth * 0.14)
    }
    // Pull toward atmosphere so distant banks stay soft
    _face.multiplyScalar(0.88)

    for (let v = 0; v < 3; v++) {
      const o = (i + v) * 3
      colors[o] = _face.r
      colors[o + 1] = _face.g
      colors[o + 2] = _face.b
    }
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  // Vertex colors are baked; fragment shader ignores normals.
  return geo
}

const cloudVertex = /* glsl */ `
attribute vec3 color;
varying vec3 vColor;
varying vec3 vWorld;
void main() {
  vColor = color;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const cloudFragment = withSharedGlsl(
  /* glsl */ `
uniform float uFogDensity;
uniform float uFogHeightScale;
uniform float uFogAmount;
varying vec3 vColor;
varying vec3 vWorld;
void main() {
  vec3 col = vColor;
  float dist = length(vWorld - cameraPosition);
  // Soft distance haze — avoid over-bleaching into a flat fog slab
  float fogFactor = fogFactorExp2(dist, uFogDensity * 1.2, vWorld.y * 0.12, uFogHeightScale);
  vec3 viewDir = normalize(vWorld - cameraPosition);
  vec3 fogCol = fogHorizonColor(viewDir);
  float fogMix = clamp(fogFactor * uFogAmount + 0.12, 0.0, 0.75);
  col = mix(col, fogCol, fogMix);
  gl_FragColor = vec4(col, 1.0);
}
`,
  { sky: true },
)

export function createClouds(sunDir: THREE.Vector3): THREE.Group {
  const group = new THREE.Group()
  group.name = 'Clouds'

  const mat = new THREE.ShaderMaterial({
    fog: false,
    depthWrite: true,
    toneMapped: true,
    uniforms: {
      uSunDir: { value: sunDir.clone() },
      uSkyNearSun: { value: COLORS.skyNearSun },
      uSkyTopLeft: { value: COLORS.skyTopLeft },
      uSkyTopRight: { value: COLORS.skyTopRight },
      uHorizonLeft: { value: COLORS.horizonLeft },
      uHorizonRight: { value: COLORS.horizonRight },
      uSunHdr: { value: 6.5 },
      uFogDensity: { value: FOG.density },
      uFogHeightScale: { value: FOG.heightScale },
      uFogAmount: { value: 1.15 },
    },
    vertexShader: cloudVertex,
    fragmentShader: cloudFragment,
  })
  bindSkyUniforms(mat.uniforms, sunDir, COLORS)
  group.userData.material = mat

  const lobeMatrix = new THREE.Matrix4()
  const lobePos = new THREE.Vector3()
  const lobeQuat = new THREE.Quaternion()
  const lobeScale = new THREE.Vector3(1, 1, 1)
  const lobeEuler = new THREE.Euler()

  for (const bank of BANKS) {
    const lobeGeos: THREE.BufferGeometry[] = []
    for (const lobe of bank.lobes) {
      const geo = buildLobe(sunDir, bank.warmth, lobe.s)
      lobePos.set(...lobe.o)
      lobeEuler.set(0, lobe.yaw ?? 0, 0)
      lobeQuat.setFromEuler(lobeEuler)
      lobeMatrix.compose(lobePos, lobeQuat, lobeScale)
      geo.applyMatrix4(lobeMatrix)
      lobeGeos.push(geo)
    }
    const merged = mergeGeometries(lobeGeos, false)
    for (const g of lobeGeos) g.dispose()
    if (!merged) continue
    const mesh = new THREE.Mesh(merged, mat)
    mesh.position.set(...bank.p)
    mesh.scale.setScalar(bank.scale)
    mesh.renderOrder = -78
    mesh.frustumCulled = false
    group.add(mesh)
  }

  return group
}

export function updateClouds(
  group: THREE.Group,
  sunDir: THREE.Vector3,
  fogDensity?: number,
) {
  const mat = group.userData.material as THREE.ShaderMaterial | undefined
  if (!mat?.uniforms) return
  mat.uniforms.uSunDir.value.copy(sunDir)
  if (fogDensity != null) mat.uniforms.uFogDensity.value = fogDensity
}

/** Dispose merged bank meshes and the shared cloud shader material. */
export function disposeClouds(group: THREE.Group): void {
  disposeObject3D(group)
  group.userData.material = undefined
}
