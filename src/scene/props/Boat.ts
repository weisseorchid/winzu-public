import * as THREE from 'three'
import { COLORS, SUN_DIR } from '../config'
import { lambertFlat, lambertVertexColored } from '../lighting/LightRig'

export type BoatHandle = {
  group: THREE.Group
  root: THREE.Group
  update: (t: number, heading: number, reducedMotion?: boolean) => void
  setVisual?: (obj: THREE.Object3D) => void
}

type Section = {
  z: number
  gun: number
  chine: number
  keel: number
  yGun: number
  yChine: number
  yKeel: number
}

/** Stern at +Z (toward the camera), bow at −Z. */
const SECTIONS: Section[] = [
  {
    z: 0.92,
    gun: 0.54,
    chine: 0.4,
    keel: 0.2,
    yGun: 0.5,
    yChine: 0.2,
    yKeel: 0.02,
  },
  {
    z: 0.38,
    gun: 0.5,
    chine: 0.36,
    keel: 0.18,
    yGun: 0.36,
    yChine: 0.1,
    yKeel: -0.045,
  },
  {
    z: -0.22,
    gun: 0.44,
    chine: 0.3,
    keel: 0.14,
    yGun: 0.34,
    yChine: 0.09,
    yKeel: -0.05,
  },
  {
    z: -0.72,
    gun: 0.28,
    chine: 0.18,
    keel: 0.07,
    yGun: 0.33,
    yChine: 0.13,
    yKeel: 0.0,
  },
  {
    z: -1.12,
    gun: 0.05,
    chine: 0.025,
    keel: 0.0,
    yGun: 0.3,
    yChine: 0.2,
    yKeel: 0.12,
  },
]

/** Sail triangle: luff on the mast, clew sheeted to port so the face reads from astern. */
const SAIL = {
  head: new THREE.Vector3(-0.05, 2.58, 0.0),
  tack: new THREE.Vector3(-0.05, 0.48, 0.02),
  clew: new THREE.Vector3(-1.18, 0.4, 0.14),
}

function hash(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return n - Math.floor(n)
}

function shade(normal: THREE.Vector3, bias: number, salt: number): THREE.Color {
  const ndl = THREE.MathUtils.clamp(normal.dot(SUN_DIR), -1, 1)
  // Stern faces the camera and is backlit; keep a brown floor so facets still separate.
  const t = THREE.MathUtils.clamp(
    ndl * 0.5 + 0.5 + bias + (salt - 0.5) * 0.28,
    0,
    1,
  )
  return COLORS.wood.clone().lerp(COLORS.woodLit, t)
}

function createHull(): THREE.Mesh {
  const positions: number[] = []
  const colors: number[] = []

  const pushTri = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    color: THREE.Color,
  ) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b)
  }

  const pushQuad = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    d: THREE.Vector3,
    outward: THREE.Vector3,
    bias = 0,
    fixed?: THREE.Color,
  ) => {
    const n = b.clone().sub(a).cross(c.clone().sub(a))
    if (n.lengthSq() < 1e-8) return
    n.normalize()
    const flip = n.dot(outward) < 0
    if (flip) n.negate()
    const mid = a.clone().add(c).multiplyScalar(0.5)
    const color = fixed ?? shade(n, bias, hash(mid.x, mid.y, mid.z))
    if (!flip) {
      pushTri(a, b, c, color)
      pushTri(a, c, d, color)
    } else {
      pushTri(a, c, b, color)
      pushTri(a, d, c, color)
    }
  }

  const gun = (s: Section, side: number) =>
    new THREE.Vector3(side * s.gun, s.yGun, s.z)
  const chine = (s: Section, side: number) =>
    new THREE.Vector3(side * s.chine, s.yChine, s.z)
  const keel = (s: Section, side: number) =>
    new THREE.Vector3(side * s.keel, s.yKeel, s.z)

  for (let i = 0; i < SECTIONS.length - 1; i++) {
    const s0 = SECTIONS[i]!
    const s1 = SECTIONS[i + 1]!
    for (const side of [-1, 1]) {
      const outward = new THREE.Vector3(side, 0.15, 0)
      pushQuad(
        gun(s0, side),
        gun(s1, side),
        chine(s1, side),
        chine(s0, side),
        outward,
        0.06,
      )
      pushQuad(
        chine(s0, side),
        chine(s1, side),
        keel(s1, side),
        keel(s0, side),
        outward,
        -0.1,
      )
    }
    pushQuad(
      keel(s0, -1),
      keel(s1, -1),
      keel(s1, 1),
      keel(s0, 1),
      new THREE.Vector3(0, -1, 0),
      -0.16,
    )

    // Deck planks, inset so the gunwale reads as a rim.
    const plank = 4
    for (let p = 0; p < plank; p++) {
      const t0 = -1 + (2 * p) / plank
      const t1 = -1 + (2 * (p + 1)) / plank
      const y0 = s0.yGun - 0.055
      const y1 = s1.yGun - 0.055
      const inset = 0.78
      const color = p % 2 === 0 ? COLORS.woodDark : COLORS.wood
      pushQuad(
        new THREE.Vector3(t0 * s0.gun * inset, y0, s0.z),
        new THREE.Vector3(t1 * s0.gun * inset, y0, s0.z),
        new THREE.Vector3(t1 * s1.gun * inset, y1, s1.z),
        new THREE.Vector3(t0 * s1.gun * inset, y1, s1.z),
        new THREE.Vector3(0, 1, 0),
        0,
        color,
      )
    }
  }

  // Transom: two halves, center proud toward the camera so the sun picks a side.
  const st = SECTIONS[0]!
  const proud = 0.045
  const center = (y: number, zBump: number) =>
    new THREE.Vector3(0, y, st.z + zBump)

  for (const side of [-1, 1]) {
    const outward = new THREE.Vector3(side * 0.25, 0, 1)
    const plank =
      side < 0 ? COLORS.woodLit.clone() : COLORS.wood.clone()
    pushQuad(
      gun(st, side),
      center(st.yGun, proud),
      center(st.yChine, proud * 0.7),
      chine(st, side),
      outward,
      0,
      plank,
    )
    pushQuad(
      chine(st, side),
      center(st.yChine, proud * 0.7),
      center(st.yKeel, proud * 0.35),
      keel(st, side),
      outward,
      0,
      plank.clone().multiplyScalar(0.82),
    )
  }

  // Bow face
  const bow = SECTIONS[SECTIONS.length - 1]!
  pushQuad(
    gun(bow, -1),
    gun(bow, 1),
    keel(bow, 1),
    keel(bow, -1),
    new THREE.Vector3(0, 0, -1),
    -0.05,
  )

  // Gunwale lip — dark rim that catches the silhouette from above.
  for (let i = 0; i < SECTIONS.length - 1; i++) {
    const s0 = SECTIONS[i]!
    const s1 = SECTIONS[i + 1]!
    for (const side of [-1, 1]) {
      const lip = (s: Section) =>
        new THREE.Vector3(side * s.gun * 1.045, s.yGun + 0.045, s.z)
      const inner = (s: Section) =>
        new THREE.Vector3(side * s.gun * 0.9, s.yGun + 0.02, s.z)
      pushQuad(
        gun(s0, side),
        gun(s1, side),
        lip(s1),
        lip(s0),
        new THREE.Vector3(side, 0, 0),
        -0.28,
      )
      pushQuad(
        lip(s0),
        lip(s1),
        inner(s1),
        inner(s0),
        new THREE.Vector3(0, 1, 0),
        -0.18,
      )
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  const mesh = new THREE.Mesh(
    geo,
    lambertVertexColored(0xffffff, {
      emissive: COLORS.woodDark,
      emissiveIntensity: 0.22,
    }),
  )
  mesh.name = 'Hull'
  return mesh
}

function sailColor(u: number, salt: number): THREE.Color {
  const c = COLORS.sail
    .clone()
    .lerp(COLORS.sailHi, THREE.MathUtils.clamp(u * 1.15, 0, 1))
  c.multiplyScalar(0.95 + salt * 0.28)
  return c
}

function createSail(): THREE.Mesh {
  const cols = 2
  const rows = 3
  const positions: number[] = []
  const colors: number[] = []
  const uvs: number[] = []

  const point = (u: number, v: number) => {
    const luff = SAIL.tack.clone().lerp(SAIL.head, v)
    const leech = SAIL.clew.clone().lerp(SAIL.head, v)
    const p = luff.clone().lerp(leech, u)
    const billow = Math.sin(v * Math.PI) * u * 0.22
    const crease =
      (Math.floor(u * 2) % 2 === 0 ? 0.1 : -0.06) * Math.sin(v * Math.PI)
    p.z += billow + crease
    p.x -= billow * 0.15
    return p
  }

  const pushTri = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    ua: [number, number],
    ub: [number, number],
    uc: [number, number],
    color: THREE.Color,
  ) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    uvs.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1])
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b)
  }

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const u0 = i / cols
      const u1 = (i + 1) / cols
      const v0 = j / rows
      const v1 = (j + 1) / rows
      const a = point(u0, v0)
      const b = point(u1, v0)
      const c = point(u1, v1)
      const d = point(u0, v1)
      const uAvg = (u0 + u1) * 0.5
      // Winding so the normal points +Z, toward the camera when the stern faces us.
      const color = sailColor(uAvg, hash(uAvg, v0, v1))
      pushTri(a, c, b, [u0, v0], [u1, v1], [u1, v0], color)
      pushTri(a, d, c, [u0, v0], [u0, v1], [u1, v1], color)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.computeVertexNormals()
  geo.userData.rest = new Float32Array(positions)

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      side: THREE.DoubleSide,
      emissive: COLORS.sailLit.clone(),
      emissiveIntensity: 0.42,
    }),
  )
  mesh.name = 'Sail'
  return mesh
}

/** Smaller starboard jib gives the hero silhouette its asymmetric two-sail read. */
function createJibSail(): THREE.Mesh {
  const sail = COLORS.sail
  const lit = COLORS.sailLit
  const hi = COLORS.sailHi
  const positions = new Float32Array([
    0.06, 2.28, -0.02,
    0.08, 0.48, 0.02,
    0.82, 0.43, -0.06,
  ])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute(
    'color',
    new THREE.BufferAttribute(
      new Float32Array([
        lit.r, lit.g, lit.b,
        hi.r, hi.g, hi.b,
        sail.r, sail.g, sail.b,
      ]),
      3,
    ),
  )
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      side: THREE.DoubleSide,
      emissive: COLORS.sail.clone(),
      emissiveIntensity: 0.32,
    }),
  )
  mesh.name = 'JibSail'
  return mesh
}

function billowSail(mesh: THREE.Mesh, t: number) {
  const geo = mesh.geometry
  const rest = geo.userData.rest as Float32Array | undefined
  const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute | undefined
  if (!rest || !pos || !uv) return
  for (let i = 0; i < pos.count; i++) {
    const across = uv.getX(i)
    const along = uv.getY(i)
    const wave =
      Math.sin(t * 1.45 + along * 5) * Math.sin(along * Math.PI) +
      Math.sin(t * 2.2 + across * 3) * 0.35
    const amp = wave * across * 0.07
    pos.setXYZ(
      i,
      rest[i * 3]! - amp * 0.2,
      rest[i * 3 + 1]!,
      rest[i * 3 + 2]! + amp,
    )
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
}

function spar(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  color: THREE.ColorRepresentation,
): THREE.Mesh {
  const dir = to.clone().sub(from)
  const len = Math.max(dir.length(), 0.001)
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.8, radius, len, 5),
    lambertFlat(color),
  )
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  )
  mesh.position.copy(from).add(to).multiplyScalar(0.5)
  return mesh
}

/**
 * Procedural boat aimed at the stern camera: faceted hull, port-sheeted sail.
 * `setVisual` can still swap in a GLB without touching BoatController.
 */
export function createBoat(): BoatHandle {
  const group = new THREE.Group()
  group.name = 'Boat'
  const root = new THREE.Group()
  root.name = 'BoatVisual'
  group.add(root)

  root.add(createHull())

  const mastTop = new THREE.Vector3(0, 2.82, -0.02)
  const mastFoot = new THREE.Vector3(0, 0.32, -0.02)
  const mast = spar(mastFoot, mastTop, 0.038, COLORS.wood)
  mast.name = 'Mast'
  root.add(mast)

  const boom = spar(
    new THREE.Vector3(0.0, 0.4, 0.02),
    SAIL.clew.clone().add(new THREE.Vector3(0.02, -0.05, 0.02)),
    0.026,
    COLORS.wood,
  )
  boom.name = 'Boom'
  root.add(boom)

  const sternPost = spar(
    new THREE.Vector3(0, 0.36, 0.78),
    new THREE.Vector3(0, 1.05, 0.78),
    0.028,
    COLORS.wood,
  )
  sternPost.name = 'SternPost'
  root.add(sternPost)

  // Thwart just forward of the stern.
  const thwart = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.045, 0.1),
    lambertFlat(COLORS.woodDark),
  )
  thwart.name = 'SternBench'
  thwart.position.set(0, 0.4, 0.48)
  root.add(thwart)

  const forwardBench = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.045, 0.1),
    lambertFlat(COLORS.woodDark),
  )
  forwardBench.name = 'ForwardBench'
  forwardBench.position.set(0, 0.4, -0.46)
  root.add(forwardBench)

  // Low faceted bow cover from the reference; it makes the stern camera read
  // as a small working sailboat rather than an empty hull.
  const bowCover = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.18, 5),
    lambertFlat(COLORS.wood),
  )
  bowCover.name = 'BowCover'
  bowCover.scale.set(1, 0.65, 1.3)
  bowCover.position.set(0, 0.44, -0.79)
  root.add(bowCover)

  // Warm rope lashings visibly connect the rig instead of leaving bare rods.
  const ropeMat = lambertFlat(COLORS.dustyPeach)
  for (const [name, position, radius] of [
    ['MastCollarLower', new THREE.Vector3(0, 0.48, -0.02), 0.06],
    ['MastCollarMid', new THREE.Vector3(0, 1.75, -0.02), 0.055],
    ['MastCollarTop', new THREE.Vector3(0, 2.58, -0.02), 0.05],
  ] as const) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 4, 8), ropeMat)
    collar.name = name
    collar.rotation.x = Math.PI / 2
    collar.position.copy(position)
    root.add(collar)
  }

  const rigging = new THREE.Group()
  rigging.name = 'Rigging'
  const ropeLine = (name: string, from: THREE.Vector3, to: THREE.Vector3) => {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to])
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: COLORS.rockLight }),
    )
    line.name = name
    rigging.add(line)
  }
  ropeLine('Forestay', mastTop, new THREE.Vector3(0, 0.5, -1.1))
  ropeLine('Backstay', mastTop, new THREE.Vector3(0, 0.65, 0.88))
  ropeLine('PortSheet', SAIL.clew, new THREE.Vector3(-0.38, 0.42, 0.64))
  ropeLine('StarboardSheet', new THREE.Vector3(0.8, 0.43, -0.06), new THREE.Vector3(0.32, 0.42, 0.65))
  root.add(rigging)

  root.add(createSail())
  root.add(createJibSail())

  const pennantGeo = new THREE.BufferGeometry()
  pennantGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([0, 0, 0, -0.4, 0.03, 0.015, 0, 0.13, 0]),
      3,
    ),
  )
  pennantGeo.computeVertexNormals()
  const pennant = new THREE.Mesh(
    pennantGeo,
    new THREE.MeshBasicMaterial({
      color: COLORS.sailLit,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: true,
    }),
  )
  pennant.position.copy(mastTop).add(new THREE.Vector3(-0.02, 0.02, 0))
  pennant.name = 'Pennant'
  root.add(pennant)

  const update = (t: number, heading: number, reducedMotion = false) => {
    // Controller heading points travel along +Z of the mesh; flip so the bow
    // leads and the stern (and the sail face) stays toward the camera.
    group.rotation.y = heading + Math.PI
    if (!reducedMotion) {
      group.position.y = Math.sin(t * 1.35) * 0.04
      root.rotation.x = Math.sin(t * 1.1) * 0.045
      root.rotation.z = Math.sin(t * 0.85) * 0.035
      const pennantMesh = root.getObjectByName('Pennant') as
        THREE.Mesh | undefined
      if (pennantMesh) {
        pennantMesh.rotation.z = Math.sin(t * 3.2) * 0.22
        pennantMesh.rotation.y = Math.sin(t * 2.1) * 0.15
      }
    }
    const sailMesh = root.getObjectByName('Sail') as THREE.Mesh | undefined
    if (sailMesh) billowSail(sailMesh, reducedMotion ? 0 : t)
  }

  const setVisual = (obj: THREE.Object3D) => {
    while (root.children.length) {
      const child = root.children[0]!
      root.remove(child)
    }
    root.add(obj)
  }

  return { group, root, update, setVisual }
}
