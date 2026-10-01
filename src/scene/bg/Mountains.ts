import * as THREE from 'three'
import { COLORS, SUN_DIR } from '../config'
import { bindSkyUniforms, withSharedGlsl } from '../glsl/includes'

/** Soft distance haze — keep range readable, not a fog slab. */
const MOUNTAIN_FOG_DENSITY = 0.013
const MOUNTAIN_FOG_HEIGHT = 0.045
/** Soft foot blend into the sea color. */
const BASE_CLIP_Y = 0.2
const BASE_MIST_TOP = 5.5

/** Soft gap behind the lighthouse (~x ≈ −6 world). */
const GAP_CENTER_X = -6
const GAP_HALF_W = 15

const COL_ROCK = new THREE.Color('#2E3844')
const COL_ROCK_LIT = new THREE.Color('#4A5562')
const COL_WARM = new THREE.Color('#6A584C')
const COL_COOL = new THREE.Color('#1E2630')
const COL_HORIZON = new THREE.Color('#6A7484')

type PeakKind = 'needle' | 'massif' | 'twin'

type PeakSpec = {
  x: number
  z: number
  height: number
  radiusX: number
  radiusZ: number
  yaw: number
  kind: PeakKind
  seed: number
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function inGap(x: number): boolean {
  return Math.abs(x - GAP_CENTER_X) < GAP_HALF_W
}

function faceAlbedo(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  sunDir: THREE.Vector3,
  salt: number,
  haze: number,
  contrast: number,
  baseDark: number,
): THREE.Color {
  const e1 = new THREE.Vector3().subVectors(b, a)
  const e2 = new THREE.Vector3().subVectors(c, a)
  const n = new THREE.Vector3().crossVectors(e1, e2).normalize()

  const ndl = THREE.MathUtils.clamp(n.dot(sunDir), -1, 1)
  const lit = THREE.MathUtils.clamp(ndl * 0.55 + 0.28, 0, 1)
  const warmAmt = THREE.MathUtils.clamp(ndl * contrast * 0.55 + 0.06, 0, 0.4)

  const avgY = (a.y + b.y + c.y) / 3
  const heightT = THREE.MathUtils.clamp((avgY + 2) / 28, 0, 1)

  const col = COL_ROCK.clone().lerp(COL_ROCK_LIT, lit * 0.48 + salt * 0.06)
  col.lerp(COL_WARM, warmAmt * 0.28)
  col.lerp(COL_COOL, (1 - lit) * 0.62 * contrast)
  // Dark cool silhouettes; keep a soft lift on sunward faces only
  col.multiplyScalar(
    (0.48 + lit * 0.28 * contrast + salt * 0.03) * (0.82 + heightT * 0.1),
  )
  col.multiplyScalar(1 - baseDark * (1 - heightT) * 0.38)
  col.lerp(COL_HORIZON, haze)
  col.multiplyScalar(0.85)
  return col
}

const vertexShader = /* glsl */ `
attribute vec3 albedo;
varying vec3 vColor;
varying vec3 vWorld;
void main() {
  vColor = albedo;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = withSharedGlsl(
  /* glsl */ `
uniform float uFogDensity;
uniform float uFogAmount;
uniform float uFogHeightScale;
uniform float uBaseClipY;
uniform float uBaseMistTop;
uniform vec3 uWaterHorizon;
varying vec3 vColor;
varying vec3 vWorld;
void main() {
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if (!gl_FrontFacing) n = -n;
  vec3 sun = normalize(uSunDir);
  float ndl = dot(n, sun);
  float wrap = clamp(ndl * 0.5 + 0.38, 0.0, 1.0);
  float skyFill = clamp(n.y * 0.28 + 0.06, 0.0, 0.18);
  vec3 col = vColor * mix(0.86, 1.06, wrap);
  col = mix(col, col * vec3(1.03, 0.98, 0.96), skyFill);

  vec3 viewDir = normalize(vWorld - cameraPosition);
  float dist = length(vWorld - cameraPosition);
  float fogFactor = fogFactorExp2(dist, uFogDensity, vWorld.y, uFogHeightScale);
  vec3 fogCol = fogHorizonColor(viewDir);
  // Bias fog toward cool waterHorizon so feet don't bleach into a bright shelf
  vec3 coolFog = mix(fogCol, uWaterHorizon, 0.55);
  float fogMix = clamp(fogFactor * uFogAmount, 0.0, 0.7);
  col = mix(col, coolFog, fogMix);

  // Soft foot blend into sea — stay close in value to far water (one horizon)
  float baseMist = 1.0 - smoothstep(uBaseClipY, uBaseMistTop, vWorld.y);
  baseMist = pow(clamp(baseMist, 0.0, 1.0), 0.85);
  col = mix(col, uWaterHorizon, baseMist * 0.55);
  col *= 1.0 - baseMist * 0.12;

  gl_FragColor = vec4(col, 1.0);
}
`,
  { sky: true },
)

function pushTri(
  positions: number[],
  colors: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  color: THREE.Color,
) {
  positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
  for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b)
}

function buildBaseRing(
  cx: number,
  cz: number,
  rx: number,
  rz: number,
  yaw: number,
  sides: number,
  seed: number,
  y: number,
): THREE.Vector3[] {
  const ring: THREE.Vector3[] = []
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  for (let i = 0; i < sides; i++) {
    const t = (i / sides) * Math.PI * 2
    // Soft oval outline — mild jitter keeps low-poly life without spikes
    const jitter = 0.9 + hash(seed * 11 + i * 3.7) * 0.18
    const lx = Math.cos(t) * rx * jitter
    const lz = Math.sin(t) * rz * jitter
    ring.push(
      new THREE.Vector3(
        cx + lx * cosY - lz * sinY,
        y,
        cz + lx * sinY + lz * cosY,
      ),
    )
  }
  return ring
}

/** Soft dome ring: midpoints stay close to the cone, not pushed into hard ridges. */
function addRoundedCone(
  positions: number[],
  colors: number[],
  ring: THREE.Vector3[],
  apex: THREE.Vector3,
  sunDir: THREE.Vector3,
  haze: number,
  contrast: number,
  baseDark: number,
  seed: number,
) {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % ring.length]!
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    // Pull mid toward apex for a bulge, keep lateral push tiny (rounder mass)
    mid.lerp(apex, 0.22 + hash(seed + i * 1.3) * 0.08)
    const out = new THREE.Vector3(mid.x - apex.x, 0, mid.z - apex.z)
    if (out.lengthSq() > 1e-6) {
      out.normalize().multiplyScalar(0.35 + hash(seed + i * 2.1) * 0.55)
      mid.add(out)
    }
    mid.y += (apex.y - Math.min(a.y, b.y)) * (0.14 + hash(seed + i) * 0.1)

    const saltA = hash(seed * 5.1 + i * 1.9)
    const saltB = hash(seed * 5.1 + i * 1.9 + 0.7)
    const colA = faceAlbedo(
      a,
      mid,
      apex,
      sunDir,
      saltA,
      haze,
      contrast,
      baseDark,
    )
    const colB = faceAlbedo(
      mid,
      b,
      apex,
      sunDir,
      saltB,
      haze,
      contrast,
      baseDark,
    )
    pushTri(positions, colors, a, mid, apex, colA)
    pushTri(positions, colors, mid, b, apex, colB)
  }

  if (ring.length >= 3) {
    const c0 = ring[0]!
    for (let i = 1; i < ring.length - 1; i++) {
      const salt = hash(seed * 2.2 + i)
      const col = faceAlbedo(
        c0,
        ring[i + 1]!,
        ring[i]!,
        sunDir,
        salt,
        haze,
        contrast * 0.35,
        baseDark,
      )
      col.multiplyScalar(0.42)
      pushTri(positions, colors, c0, ring[i + 1]!, ring[i]!, col)
    }
  }
}

function addPeak(
  positions: number[],
  colors: number[],
  spec: PeakSpec,
  sunDir: THREE.Vector3,
  haze: number,
  contrast: number,
  baseDark: number,
) {
  // Sit slightly under the waterline so feet meet the sea cleanly
  const baseY = -1.2
  // More sides → rounder silhouette while staying low-poly
  const sides = spec.kind === 'massif' ? 9 : spec.kind === 'needle' ? 6 : 8

  if (spec.kind === 'twin') {
    const spread = spec.radiusX * (0.32 + hash(spec.seed + 2) * 0.14)
    const cosY = Math.cos(spec.yaw)
    const sinY = Math.sin(spec.yaw)
    addPeak(
      positions,
      colors,
      {
        ...spec,
        kind: 'massif',
        x: spec.x - spread * cosY,
        z: spec.z - spread * sinY,
        height: spec.height * (0.78 + hash(spec.seed + 3) * 0.14),
        radiusX: spec.radiusX * 0.82,
        radiusZ: spec.radiusZ * 0.86,
        seed: spec.seed + 0.3,
      },
      sunDir,
      haze,
      contrast,
      baseDark,
    )
    addPeak(
      positions,
      colors,
      {
        ...spec,
        kind: 'massif',
        x: spec.x + spread * cosY,
        z: spec.z + spread * sinY,
        height: spec.height * (0.68 + hash(spec.seed + 4) * 0.18),
        radiusX: spec.radiusX * 0.96,
        radiusZ: spec.radiusZ * 0.94,
        seed: spec.seed + 0.9,
      },
      sunDir,
      haze,
      contrast,
      baseDark,
    )
    return
  }

  const ring = buildBaseRing(
    spec.x,
    spec.z,
    spec.radiusX,
    spec.radiusZ,
    spec.yaw,
    sides,
    spec.seed,
    baseY,
  )

  if (spec.kind === 'massif') {
    const shoulder = ring[Math.floor(ring.length * 0.35)]!
    // Soft shoulder bump — lower than before so mass stays dome-like
    shoulder.y = baseY + spec.height * (0.22 + hash(spec.seed + 0.4) * 0.14)
    const nudge = 0.08 + hash(spec.seed + 1.1) * 0.12
    shoulder.x += (shoulder.x - spec.x) * nudge
    shoulder.z += (shoulder.z - spec.z) * nudge
  }

  const ox = (hash(spec.seed + 9) - 0.5) * spec.radiusX * 0.22
  const oz = (hash(spec.seed + 10) - 0.5) * spec.radiusZ * 0.2
  const apex = new THREE.Vector3(spec.x + ox, spec.height, spec.z + oz)

  addRoundedCone(
    positions,
    colors,
    ring,
    apex,
    sunDir,
    haze,
    contrast,
    baseDark,
    spec.seed,
  )
}

function pickKind(seed: number, prefer: PeakKind[]): PeakKind {
  return prefer[Math.floor(hash(seed) * prefer.length) % prefer.length]!
}

function scatterPeaks(opts: {
  zCenter: number
  zSpread: number
  halfWidth: number
  count: number
  heightMin: number
  heightMax: number
  radiusScale: number
  seed: number
  kinds: PeakKind[]
}): PeakSpec[] {
  const peaks: PeakSpec[] = []
  let attempts = 0
  let placed = 0
  while (placed < opts.count && attempts < opts.count * 10) {
    attempts++
    const i = placed
    const s = opts.seed + attempts * 1.37
    const u = (hash(s) * 2 - 1) * 0.94
    const x = u * opts.halfWidth
    if (inGap(x)) continue

    const z = opts.zCenter + (hash(s + 0.5) - 0.5) * opts.zSpread * 2
    const kind = pickKind(s + 1.1, opts.kinds)
    const hT = hash(s + 2.2)
    let height = opts.heightMin + hT * (opts.heightMax - opts.heightMin)
    // Prefer squat mass over spires
    if (kind === 'needle') height *= 0.92
    if (kind === 'massif') height *= 0.78

    const rBase =
      opts.radiusScale *
      (kind === 'needle' ? 0.95 : kind === 'massif' ? 1.65 : 1.35) *
      (0.9 + hash(s + 3.3) * 0.35)

    let tooClose = false
    for (const p of peaks) {
      const dx = p.x - x
      const dz = p.z - z
      const minDist = (p.radiusX + rBase) * 0.32
      if (dx * dx + dz * dz < minDist * minDist * 0.22) {
        tooClose = true
        break
      }
    }
    if (tooClose && hash(s + 4) > 0.42) continue

    peaks.push({
      x,
      z,
      height,
      radiusX: rBase * (1.35 + hash(s + 5) * 0.45),
      radiusZ: rBase * (1.2 + hash(s + 6) * 0.4),
      yaw: hash(s + 7) * Math.PI * 2,
      kind,
      seed: s + i,
    })
    placed++
  }
  return peaks
}

function createBand(opts: {
  zCenter: number
  zSpread: number
  halfWidth: number
  count: number
  heightMin: number
  heightMax: number
  radiusScale: number
  seed: number
  kinds: PeakKind[]
  fogAmount: number
  haze: number
  contrast: number
  baseDark: number
  renderOrder: number
  sunDir: THREE.Vector3
}): THREE.Mesh {
  const positions: number[] = []
  const colors: number[] = []
  for (const peak of scatterPeaks(opts)) {
    addPeak(
      positions,
      colors,
      peak,
      opts.sunDir,
      opts.haze,
      opts.contrast,
      opts.baseDark,
    )
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('albedo', new THREE.Float32BufferAttribute(colors, 3))

  const mat = new THREE.ShaderMaterial({
    transparent: false,
    depthWrite: true,
    fog: false,
    side: THREE.DoubleSide,
    uniforms: {
      uSunDir: { value: opts.sunDir.clone() },
      uSkyNearSun: { value: COLORS.skyNearSun },
      uSkyTopLeft: { value: COLORS.skyTopLeft },
      uSkyTopRight: { value: COLORS.skyTopRight },
      uHorizonLeft: { value: COLORS.horizonLeft },
      uHorizonRight: { value: COLORS.horizonRight },
      uSunHdr: { value: 6.5 },
      uFogDensity: { value: MOUNTAIN_FOG_DENSITY },
      uFogAmount: { value: opts.fogAmount },
      uFogHeightScale: { value: MOUNTAIN_FOG_HEIGHT },
      uBaseClipY: { value: BASE_CLIP_Y },
      uBaseMistTop: { value: BASE_MIST_TOP },
      uWaterHorizon: { value: COLORS.waterHorizon },
    },
    vertexShader,
    fragmentShader,
  })
  bindSkyUniforms(mat.uniforms, opts.sunDir, COLORS)

  const mesh = new THREE.Mesh(geo, mat)
  mesh.name = 'MountainLayer'
  mesh.renderOrder = opts.renderOrder
  mesh.frustumCulled = false
  return mesh
}

/** Three receding bands of soft, dark, foggy massifs. */
export function createMountains(sunDir: THREE.Vector3 = SUN_DIR): THREE.Group {
  const group = new THREE.Group()
  group.name = 'Mountains'
  group.add(
    createBand({
      zCenter: -165,
      zSpread: 12,
      halfWidth: 205,
      count: 30,
      heightMin: 10,
      heightMax: 20,
      radiusScale: 16,
      seed: 1.4,
      kinds: ['massif', 'massif', 'twin', 'needle'],
      fogAmount: 0.68,
      haze: 0.32,
      contrast: 0.75,
      baseDark: 0.5,
      renderOrder: -84,
      sunDir,
    }),
    createBand({
      zCenter: -136,
      zSpread: 15,
      halfWidth: 178,
      count: 20,
      heightMin: 14,
      heightMax: 28,
      radiusScale: 20,
      seed: 2.6,
      kinds: ['massif', 'twin', 'massif', 'needle', 'massif'],
      fogAmount: 0.55,
      haze: 0.18,
      contrast: 0.9,
      baseDark: 0.46,
      renderOrder: -74,
      sunDir,
    }),
    createBand({
      zCenter: -108,
      zSpread: 11,
      halfWidth: 152,
      count: 12,
      heightMin: 12,
      heightMax: 22,
      radiusScale: 22,
      seed: 3.8,
      kinds: ['massif', 'twin', 'massif', 'massif'],
      fogAmount: 0.45,
      haze: 0.1,
      contrast: 1.0,
      baseDark: 0.44,
      renderOrder: -64,
      sunDir,
    }),
  )
  return group
}

export function updateMountains(
  group: THREE.Group,
  sunDir: THREE.Vector3,
  fogDensity: number = MOUNTAIN_FOG_DENSITY,
) {
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mat = mesh.material as THREE.ShaderMaterial
    if (mat.uniforms?.uSunDir) mat.uniforms.uSunDir.value.copy(sunDir)
    if (mat.uniforms?.uFogDensity) mat.uniforms.uFogDensity.value = fogDensity
  })
}
