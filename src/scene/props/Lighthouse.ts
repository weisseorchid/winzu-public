import * as THREE from 'three'
import { COLORS } from '../config'
import { disposeObject3D } from '../dispose'
import { lambertFlat } from '../lighting/LightRig'
import { createRock } from './Rock'

function createIsland(sunDir: THREE.Vector3): THREE.Group {
  const g = new THREE.Group()
  g.name = 'Island'

  // Wide flattened plinth under the tower
  const plinth = createRock({
    radius: 2.6,
    seed: 10.1,
    sunDir,
    scale: new THREE.Vector3(1.35, 0.55, 1.2),
    fog: true,
  })
  plinth.name = 'IslandBase'
  plinth.position.set(0, -0.55, 0)
  g.add(plinth)

  const masses: Array<{
    radius: number
    seed: number
    pos: [number, number, number]
    scale: [number, number, number]
  }> = [
    { radius: 1.6, seed: 11.2, pos: [-1.8, -0.4, 0.6], scale: [1.1, 0.7, 1.0] },
    {
      radius: 1.35,
      seed: 12.4,
      pos: [1.6, -0.45, 0.4],
      scale: [1.0, 0.65, 1.15],
    },
    {
      radius: 1.2,
      seed: 13.7,
      pos: [0.4, -0.5, -1.5],
      scale: [1.2, 0.6, 0.95],
    },
    {
      radius: 1.1,
      seed: 14.9,
      pos: [-1.1, -0.35, -1.2],
      scale: [0.95, 0.75, 1.05],
    },
    {
      radius: 0.95,
      seed: 15.3,
      pos: [1.9, -0.4, -0.9],
      scale: [1.05, 0.55, 0.9],
    },
  ]

  for (const m of masses) {
    const rock = createRock({
      radius: m.radius,
      seed: m.seed,
      sunDir,
      scale: new THREE.Vector3(...m.scale),
      fog: true,
    })
    rock.name = `IslandRock_${g.children.length}`
    rock.position.set(...m.pos)
    g.add(rock)
  }

  return g
}

function createPagodaRoof(
  y: number,
  radius: number,
  sunDir: THREE.Vector3,
): THREE.Group {
  const g = new THREE.Group()
  g.name = 'LanternRoof'
  const tiers = [
    { y: 0, r: radius * 1.15, h: 0.35 },
    { y: 0.32, r: radius * 0.72, h: 0.28 },
  ]
  for (const t of tiers) {
    const geo = new THREE.CylinderGeometry(t.r * 0.15, t.r, t.h, 8, 1, false)
    const mesh = new THREE.Mesh(
      geo,
      lambertFlat(COLORS.rockDark, { fog: true, sunDir }),
    )
    mesh.name = `RoofTier_${tiers.indexOf(t) + 1}`
    mesh.position.y = y + t.y
    g.add(mesh)
    const eave = new THREE.Mesh(
      new THREE.CylinderGeometry(t.r * 1.05, t.r * 0.95, 0.06, 8),
      lambertFlat(COLORS.tower, { fog: true, sunDir }),
    )
    eave.name = `RoofEave_${tiers.indexOf(t) + 1}`
    eave.position.y = y + t.y - t.h * 0.35
    g.add(eave)
  }
  const finial = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.35, 6),
    lambertFlat(COLORS.rockDark, { fog: true, sunDir }),
  )
  finial.name = 'RoofFinial'
  finial.position.y = y + 0.75
  g.add(finial)
  return g
}

function createFlag(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(0.55, 0.32, 4, 2)
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: COLORS.buoyRed.clone() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float flutter = sin(uTime * 4.0 + uv.x * 6.0) * 0.06 * uv.x;
        p.z += flutter;
        p.y += sin(uTime * 3.2 + uv.x * 4.0) * 0.03 * uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec3 c = uColor * (0.85 + vUv.x * 0.2);
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0.28, 0, 0)
  mesh.name = 'Flag'
  return mesh
}

function createLanternBeam(lanternY: number): THREE.Mesh {
  const beamLen = 14
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, beamLen, 16, 1, true),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false,
      uniforms: {
        uColor: { value: COLORS.lantern.clone() },
        uOpacity: { value: 0.12 },
      },
      vertexShader: /* glsl */ `
        varying float vAlong;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vAlong = uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlong;
        varying vec2 vUv;
        void main() {
          float radial = 1.0 - abs(vUv.x * 2.0 - 1.0);
          float along = smoothstep(0.0, 0.15, vAlong) * (1.0 - smoothstep(0.55, 1.0, vAlong));
          float a = radial * radial * along * uOpacity;
          if (a < 0.004) discard;
          gl_FragColor = vec4(uColor * 1.4 * a, a);
        }
      `,
    }),
  )
  beam.name = 'LanternBeam'
  beam.position.set(0.4, lanternY - 0.2, 0.6)
  beam.rotation.x = Math.PI / 2 + 0.22
  beam.rotation.z = -0.35
  beam.renderOrder = 5
  return beam
}

function createLanternSpot(lanternPos: THREE.Vector3): THREE.SpotLight {
  const lanternLight = new THREE.SpotLight(
    COLORS.lantern,
    0.7,
    28,
    0.28,
    0.55,
    1.6,
  )
  lanternLight.name = 'LanternLight'
  lanternLight.position.copy(lanternPos)
  lanternLight.target.position.set(2.5, lanternPos.y - 1.2, 6)
  return lanternLight
}

function findLanternMesh(root: THREE.Object3D): THREE.Mesh | undefined {
  const named =
    root.getObjectByName('Lantern') ?? root.getObjectByName('Lantern_Glass')
  if (named && (named as THREE.Mesh).isMesh) return named as THREE.Mesh

  let found: THREE.Mesh | undefined
  root.traverse((obj) => {
    if (found) return
    const mesh = obj as THREE.Mesh
    if (mesh.isMesh && /lantern/i.test(mesh.name)) found = mesh
  })
  return found
}

function lanternLocalY(root: THREE.Object3D, lantern: THREE.Mesh): number {
  root.updateMatrixWorld(true)
  const world = new THREE.Vector3()
  lantern.getWorldPosition(world)
  return root.worldToLocal(world).y
}

function basicColor(mesh: THREE.Mesh | undefined): THREE.Color | null {
  if (!mesh?.material) return null
  const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  if (mat instanceof THREE.MeshBasicMaterial) return mat.color
  return null
}

/**
 * Attach spot / volumetric beam / flag when a GLB (or stripped visual) lacks them.
 * Anchors to `Lantern` / `Lantern_Glass` when present.
 */
export function dressLighthouseVisual(root: THREE.Object3D) {
  const lantern = findLanternMesh(root)
  const ly = lantern ? lanternLocalY(root, lantern) : 6.25
  const lanternPos = new THREE.Vector3(0, ly, 0)

  if (!root.getObjectByName('LanternLight')) {
    const spot = createLanternSpot(lanternPos)
    root.add(spot)
    root.add(spot.target)
  }
  if (!root.getObjectByName('LanternBeam')) {
    root.add(createLanternBeam(ly))
  }
  if (!root.getObjectByName('Flag')) {
    const flag = createFlag()
    flag.position.set(0, ly + 1.3, 0)
    root.add(flag)
  }
}

export type LighthouseHandle = {
  group: THREE.Group
  root: THREE.Group
  update: (t: number, lit: boolean) => void
  setVisual: (obj: THREE.Object3D) => void
}

/**
 * Procedural lighthouse landmark (island + tower + cottage + lantern FX).
 * `setVisual` swaps in a GLB and re-dresses missing lantern set pieces.
 */
export function createLighthouse(sunDir: THREE.Vector3): LighthouseHandle {
  const group = new THREE.Group()
  group.name = 'Lighthouse'
  const root = new THREE.Group()
  root.name = 'LighthouseVisual'
  group.add(root)

  const fogOpts = { fog: true as const, sunDir }

  root.add(createIsland(sunDir))

  // Tapered 8-sided tower
  const towerH = 5.2
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.95, towerH, 8),
    lambertFlat(COLORS.tower, fogOpts),
  )
  tower.name = 'Tower'
  tower.position.y = towerH * 0.5 + 0.4
  root.add(tower)

  // Door facing roughly +Z (camera)
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.72),
    lambertFlat(COLORS.rockDark, fogOpts),
  )
  door.name = 'TowerDoor'
  door.position.set(0, 1.05, 0.92)
  root.add(door)

  // Slit windows with warm emissive glow
  const slitMat = new THREE.MeshBasicMaterial({
    color: COLORS.lantern.clone().multiplyScalar(2.2),
    toneMapped: false,
  })
  for (const y of [2.4, 3.6]) {
    const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.28), slitMat)
    slit.position.set(0.72, y, 0.35)
    slit.rotation.y = -0.35
    slit.name = `TowerWindow_${y === 2.4 ? 1 : 2}`
    root.add(slit)
  }

  // Gallery + railing
  const gallery = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.12, 8),
    lambertFlat(COLORS.tower, fogOpts),
  )
  gallery.name = 'GalleryPlatform'
  gallery.position.y = towerH + 0.35
  root.add(gallery)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.4, 4),
      lambertFlat(COLORS.rockDark, fogOpts),
    )
    post.name = `GalleryRailPost_${i + 1}`
    post.position.set(Math.cos(a) * 0.78, towerH + 0.55, Math.sin(a) * 0.78)
    root.add(post)
  }
  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.02, 4, 8),
    lambertFlat(COLORS.rockDark, fogOpts),
  )
  rail.name = 'GalleryRail'
  rail.rotation.x = Math.PI / 2
  rail.position.y = towerH + 0.72
  root.add(rail)

  // Lantern (HDR emissive for bloom) — unlit ~2.4× so linear luma clears threshold
  const lanternMat = new THREE.MeshBasicMaterial({
    color: COLORS.lantern,
    toneMapped: false,
  })
  lanternMat.color.multiplyScalar(4.2)
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.7, 8),
    lanternMat,
  )
  lantern.position.y = towerH + 1.05
  lantern.name = 'Lantern'
  root.add(lantern)

  const lanternLight = createLanternSpot(lantern.position.clone())
  root.add(lanternLight)
  root.add(lanternLight.target)

  root.add(createLanternBeam(lantern.position.y))

  const roof = createPagodaRoof(towerH + 1.45, 0.7, sunDir)
  root.add(roof)

  const flag = createFlag()
  flag.position.set(0, towerH + 2.35, 0)
  root.add(flag)

  // Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.1, 1.3),
    lambertFlat(COLORS.tower, fogOpts),
  )
  cabin.name = 'Cottage'
  cabin.position.set(-1.1, 1.05, 0.2)
  root.add(cabin)
  const cabinRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 0.55, 4),
    lambertFlat(COLORS.rockDark, fogOpts),
  )
  cabinRoof.name = 'CottageRoof'
  cabinRoof.position.set(-1.1, 1.85, 0.2)
  cabinRoof.rotation.y = Math.PI / 4
  root.add(cabinRoof)
  const windowMat = new THREE.MeshBasicMaterial({
    color: COLORS.lantern.clone().multiplyScalar(4.0),
    toneMapped: false,
  })
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.44), windowMat)
  win.name = 'CottageWarmWindow'
  win.position.set(-1.1 - 0.81, 1.1, 0.2)
  win.rotation.y = Math.PI / 2
  root.add(win)

  // Fence
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.45, 0.06),
      lambertFlat(COLORS.wood, fogOpts),
    )
    p.name = `CottageFencePost_${i + 1}`
    p.position.set(0.6 + i * 0.28, 0.85, 1.1)
    root.add(p)
  }
  const railF = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.05, 0.05),
    lambertFlat(COLORS.wood, fogOpts),
  )
  railF.name = 'CottageFenceRail'
  railF.position.set(1.15, 1.0, 1.1)
  root.add(railF)

  const update = (t: number, lit: boolean) => {
    const flagMesh = root.getObjectByName('Flag') as THREE.Mesh | undefined
    const flagMat = flagMesh?.material
    if (flagMat instanceof THREE.ShaderMaterial && flagMat.uniforms?.uTime) {
      flagMat.uniforms.uTime.value = t
    }

    const lanternMesh = findLanternMesh(root)
    const lanternColor = basicColor(lanternMesh)
    if (lanternColor) {
      lanternColor.copy(COLORS.lantern).multiplyScalar(lit ? 6.0 : 4.2)
    }

    const cottageWin = root.getObjectByName('CottageWarmWindow') as
      | THREE.Mesh
      | undefined
    const winColor = basicColor(cottageWin)
    if (winColor) {
      winColor.copy(COLORS.lantern).multiplyScalar(lit ? 4.4 : 3.2)
    }

    for (const name of ['TowerWindow_1', 'TowerWindow_2']) {
      const slit = root.getObjectByName(name) as THREE.Mesh | undefined
      const slitColor = basicColor(slit)
      if (slitColor) {
        slitColor.copy(COLORS.lantern).multiplyScalar(lit ? 3.6 : 2.6)
      }
    }

    const spot = root.getObjectByName('LanternLight') as
      | THREE.SpotLight
      | undefined
    if (spot) spot.intensity = lit ? 2.2 : 1.0

    const beam = root.getObjectByName('LanternBeam') as THREE.Mesh | undefined
    const beamMat = beam?.material
    if (beamMat instanceof THREE.ShaderMaterial && beamMat.uniforms?.uOpacity) {
      beamMat.uniforms.uOpacity.value = lit ? 0.2 : 0.1
      beam!.visible = true
    }
  }

  const setVisual = (obj: THREE.Object3D) => {
    while (root.children.length) {
      const child = root.children[0]!
      root.remove(child)
      disposeObject3D(child)
    }
    root.add(obj)
    dressLighthouseVisual(root)
  }

  return { group, root, update, setVisual }
}
