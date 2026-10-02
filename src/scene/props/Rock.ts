import * as THREE from 'three'
import { COLORS } from '../config'
import { lambertVertexColored } from '../lighting/LightRig'

function hash3(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return n - Math.floor(n)
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()
const _ab = new THREE.Vector3()
const _ac = new THREE.Vector3()
const _n = new THREE.Vector3()
const _p = new THREE.Vector3()
const _face = new THREE.Color()

/**
 * Cleaved crystalline rock — continuous crystal warp (watertight), then
 * non-indexed per-face albedo so facets read as polished cut stone.
 */
export function createRock(opts?: {
  radius?: number
  seed?: number
  sunDir?: THREE.Vector3
  /** Extra non-uniform squash after generation. */
  scale?: THREE.Vector3
  fog?: boolean
}): THREE.Mesh {
  const radius = opts?.radius ?? 1
  const seed = opts?.seed ?? 1
  const sunDir = opts?.sunDir ?? new THREE.Vector3(-0.5, 0.1, -0.8).normalize()

  // Indexed first so shared verts stay watertight under continuous warp
  const indexed = new THREE.IcosahedronGeometry(1, 1)
  const ipos = indexed.attributes.position as THREE.BufferAttribute

  // Seed-stable cleave normals — crystal faces form where |dot| is max
  const cleaves: THREE.Vector3[] = []
  for (let k = 0; k < 6; k++) {
    const hx = hash3(seed, k * 1.7, 0.3)
    const hy = hash3(seed * 1.3, k * 2.1, 1.1)
    const hz = hash3(seed * 0.7, k * 0.9, 2.4)
    const yBias = k % 2 === 0 ? 0.5 : 1.35
    cleaves.push(
      new THREE.Vector3(
        hx * 2 - 1,
        (hy - 0.35) * yBias,
        hz * 2 - 1,
      ).normalize(),
    )
  }
  cleaves.push(new THREE.Vector3(0.12, 1, 0.06).normalize())

  for (let i = 0; i < ipos.count; i++) {
    _p.set(ipos.getX(i), ipos.getY(i), ipos.getZ(i)).normalize()
    const h = hash3(_p.x + seed, _p.y + seed * 0.3, _p.z - seed)

    let maxAbs = 0.001
    for (const axis of cleaves) {
      const d = Math.abs(_p.dot(axis))
      if (d > maxAbs) maxAbs = d
    }
    // High crystal mix → sharp cleaved planes, still one solid mass
    const crystal = 0.9 + h * 0.08
    const rSphere = 0.8 + h * 0.32
    const rCrystal = (0.9 + h * 0.26) / maxAbs
    let r = THREE.MathUtils.lerp(rSphere, rCrystal, crystal)
    if (h > 0.68) r *= 1.06 + (h - 0.68) * 0.5

    _p.multiplyScalar(r)
    _p.x *= 1.2
    _p.y *= 0.5
    _p.z *= 1.05

    if (_p.y < 0) _p.y *= 0.48
    if (_p.y > 0.22) _p.y *= 0.8

    const shear = (hash3(seed + 4.2, _p.x, _p.z) - 0.5) * 0.26
    const sx = _p.x
    const sz = _p.z
    _p.x = sx + sz * shear
    _p.z = sz - sx * shear * 0.42

    ipos.setXYZ(i, _p.x * radius, _p.y * radius, _p.z * radius)
  }
  ipos.needsUpdate = true

  const geo = indexed.toNonIndexed()
  indexed.dispose()
  const pos = geo.attributes.position as THREE.BufferAttribute

  const warm = COLORS.rockWarm
  const dark = COLORS.rockDark
  const mid = COLORS.rock
  const litRock = COLORS.rockLight
  const peach = COLORS.dustyPeach
  const sunset = COLORS.horizonLeft
  const colors = new Float32Array(pos.count * 3)

  for (let i = 0; i < pos.count; i += 3) {
    _a.fromBufferAttribute(pos, i)
    _b.fromBufferAttribute(pos, i + 1)
    _c.fromBufferAttribute(pos, i + 2)
    _ab.subVectors(_b, _a)
    _ac.subVectors(_c, _a)
    _n.crossVectors(_ab, _ac).normalize()

    const ndl = _n.dot(sunDir)
    const wrap = THREE.MathUtils.clamp(ndl * 0.7 + 0.28, 0, 1)
    const band = Math.floor(wrap * 3.999) / 3

    _face.copy(dark).lerp(mid, 0.22 + band * 0.5)
    _face.lerp(warm, band * 0.7)
    if (band > 0.4) _face.lerp(litRock, (band - 0.4) * 1.6)
    if (ndl > 0.2) {
      _face.lerp(peach, (ndl - 0.2) * 0.48)
      if (ndl > 0.45) _face.lerp(sunset, (ndl - 0.45) * 0.28)
    }
    if (_n.y > 0.18) _face.lerp(warm, (_n.y - 0.18) * 0.45)
    if (_n.y < -0.06) _face.lerp(dark, (-_n.y - 0.06) * 0.7)
    const camFacing = THREE.MathUtils.clamp(_n.z * 0.5 + 0.5, 0, 1)
    _face.multiplyScalar(1 - camFacing * 0.06)

    for (let v = 0; v < 3; v++) {
      const o = (i + v) * 3
      colors[o] = _face.r
      colors[o + 1] = _face.g
      colors[o + 2] = _face.b
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  const mat = lambertVertexColored(undefined, {
    fog: opts?.fog ?? true,
    sunDir,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.name = 'Rock'
  if (opts?.scale) mesh.scale.copy(opts.scale)
  mesh.position.y = -radius * 0.25
  return mesh
}
