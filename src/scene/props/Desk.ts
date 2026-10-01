import * as THREE from 'three'
import { COLORS, SUN } from '../config'
import { lambertFlat } from '../lighting/LightRig'

export type DeskPropId =
  | 'map'
  | 'letter_burn'
  | 'letter_renewal'
  | 'letter_copy'
  | 'book'
  | 'globe'
  | 'plant'
  | 'chair'

export type DeskHandle = {
  group: THREE.Group
  /** Named pickable meshes for raycasting. */
  pickables: Map<DeskPropId, THREE.Object3D>
  room: THREE.Group
}

function box(
  w: number,
  h: number,
  d: number,
  color: THREE.ColorRepresentation,
  y: number,
  x = 0,
  z = 0,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    lambertFlat(color),
  )
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * Procedural lighthouse-office desk with named pickables.
 * `map` → node graph; `letter_*` → document flows.
 * Warm interior extension of palette_ref (wood/parchment dominate).
 */
export function createDeskScene(): DeskHandle {
  const group = new THREE.Group()
  group.name = 'DeskScene'
  const room = new THREE.Group()
  room.name = 'Room'
  const pickables = new Map<DeskPropId, THREE.Object3D>()

  // Floor + rug
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    lambertFlat(COLORS.wood),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  room.add(floor)

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2.4),
    lambertFlat(COLORS.sail),
  )
  rug.rotation.x = -Math.PI / 2
  rug.position.set(0, 0.01, 0.2)
  rug.receiveShadow = true
  room.add(rug)

  // Back wall + window light suggestion
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 5),
    lambertFlat(COLORS.dustyPeach),
  )
  wall.position.set(0, 2.5, -3.2)
  room.add(wall)

  const windowGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.4),
    new THREE.MeshBasicMaterial({
      color: COLORS.lantern.clone().multiplyScalar(1.8),
      transparent: true,
      opacity: 0.7,
      toneMapped: false,
    }),
  )
  windowGlow.position.set(1.4, 2.4, -3.15)
  room.add(windowGlow)

  group.add(room)

  // Desk body
  const deskTop = box(2.8, 0.08, 1.4, COLORS.woodLit, 0.92)
  const deskLeft = box(0.12, 0.85, 1.3, COLORS.wood, 0.45, -1.3)
  const deskRight = box(0.12, 0.85, 1.3, COLORS.wood, 0.45, 1.3)
  const deskBack = box(2.6, 0.7, 0.1, COLORS.woodDark, 0.55, 0, -0.6)
  group.add(deskTop, deskLeft, deskRight, deskBack)

  // Map (primary pickable) — parchment with cool ocean hint
  const map = box(1.4, 0.02, 0.9, COLORS.offWhite, 0.98, -0.15, 0.05)
  map.name = 'map'
  map.userData.deskId = 'map' satisfies DeskPropId
  pickables.set('map', map)
  group.add(map)

  // Letters / docs
  const letterBurn = box(0.28, 0.015, 0.36, COLORS.offWhite, 0.99, 0.75, -0.25)
  letterBurn.name = 'letter_burn'
  letterBurn.userData.deskId = 'letter_burn'
  const seal = box(0.06, 0.02, 0.06, COLORS.sail, 1.02, 0.78, -0.2)
  letterBurn.add(seal)
  pickables.set('letter_burn', letterBurn)
  group.add(letterBurn)

  const letterRenewal = box(0.3, 0.015, 0.38, COLORS.dustyPeach, 0.99, 0.55, 0.35)
  letterRenewal.name = 'letter_renewal'
  letterRenewal.userData.deskId = 'letter_renewal'
  pickables.set('letter_renewal', letterRenewal)
  group.add(letterRenewal)

  const letterCopy = box(0.26, 0.02, 0.34, COLORS.offWhite, 0.995, -0.95, 0.4)
  letterCopy.name = 'letter_copy'
  letterCopy.userData.deskId = 'letter_copy'
  pickables.set('letter_copy', letterCopy)
  group.add(letterCopy)

  // Ambient props — cool spines / globe only as small accents
  const book = box(0.35, 0.08, 0.28, COLORS.oceanLight, 1.0, -1.0, -0.35)
  book.name = 'book'
  book.userData.deskId = 'book'
  pickables.set('book', book)
  group.add(book)

  const globe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.22, 1),
    lambertFlat(COLORS.blueGrey),
  )
  globe.position.set(1.05, 1.2, 0.35)
  globe.name = 'globe'
  globe.userData.deskId = 'globe'
  globe.castShadow = true
  pickables.set('globe', globe)
  group.add(globe)

  const pot = box(0.18, 0.2, 0.18, COLORS.rock, 1.06, -1.15, 0.45)
  const leaf = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2, 0),
    lambertFlat(COLORS.oceanLight),
  )
  leaf.position.set(-1.15, 1.35, 0.45)
  leaf.scale.set(1, 1.3, 0.8)
  const plantGroup = new THREE.Group()
  plantGroup.name = 'plant'
  plantGroup.userData.deskId = 'plant'
  plantGroup.add(pot, leaf)
  pickables.set('plant', plantGroup)
  group.add(plantGroup)

  const chair = new THREE.Group()
  chair.name = 'chair'
  chair.userData.deskId = 'chair'
  const seat = box(0.55, 0.08, 0.5, COLORS.wood, 0.45, 0, 1.05)
  const back = box(0.55, 0.55, 0.08, COLORS.woodDark, 0.75, 0, 1.28)
  const cushion = box(0.5, 0.06, 0.45, COLORS.blueGrey, 0.52, 0, 1.05)
  chair.add(seat, back, cushion)
  pickables.set('chair', chair)
  group.add(chair)

  // Warm window key — sunset peach illumination
  const key = new THREE.DirectionalLight(SUN.keyColor, 1.65)
  key.position.set(4, 6, 2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 20
  key.shadow.camera.left = -4
  key.shadow.camera.right = 4
  key.shadow.camera.top = 4
  key.shadow.camera.bottom = -4
  const fill = new THREE.HemisphereLight(COLORS.lantern, COLORS.woodDark, 0.55)
  group.add(key, fill)

  return { group, pickables, room }
}

export function setDeskHighlight(
  obj: THREE.Object3D | undefined,
  on: boolean,
) {
  if (!obj) return
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    for (const raw of mats) {
      const mat = raw as THREE.MeshLambertMaterial
      if (!mat || !('emissive' in mat)) continue
      if (on) {
        mat.emissive = COLORS.sailLit.clone()
        mat.emissiveIntensity = 0.55
      } else {
        mat.emissive = new THREE.Color(0x000000)
        mat.emissiveIntensity = 0
      }
    }
  })
}
