import * as THREE from 'three'
import { COLORS } from '../config'
import { lambertFlat, lambertVertexColored } from '../lighting/LightRig'

export type PierHandle = {
  group: THREE.Group
}

function plankMat() {
  return lambertFlat(COLORS.woodLit)
}

function darkWood() {
  return lambertFlat(COLORS.woodDark)
}

/** Low-poly wooden pier with rope posts and hanging lantern (Scene 0). */
export function createPier(opts?: {
  length?: number
  width?: number
  withStairs?: boolean
}): PierHandle {
  const length = opts?.length ?? 7.2
  const width = opts?.width ?? 2.0
  const group = new THREE.Group()
  group.name = 'Pier'

  // Individual deck planks for faceted read
  const plankCount = 9
  const plankLen = length / plankCount
  for (let i = 0; i < plankCount; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.96, 0.1, plankLen * 0.92),
      i % 2 === 0 ? plankMat() : lambertFlat(COLORS.wood),
    )
    plank.name = `DeckPlank_${i + 1}`
    plank.position.set(0, 0.38, -length * 0.5 + plankLen * (i + 0.5))
    plank.receiveShadow = true
    plank.castShadow = true
    group.add(plank)
  }

  const postGeo = new THREE.CylinderGeometry(0.11, 0.13, 1.25, 5)
  const postMat = darkWood()
  const posts: [number, number][] = [
    [-width * 0.42, -length * 0.42],
    [width * 0.42, -length * 0.42],
    [-width * 0.42, 0],
    [width * 0.42, 0],
    [-width * 0.42, length * 0.38],
    [width * 0.42, length * 0.38],
  ]
  for (const [x, z] of posts) {
    const post = new THREE.Mesh(postGeo, postMat)
    post.name = `RopePost_${group.children.filter((child) => child.name.startsWith('RopePost')).length + 1}`
    post.position.set(x, 0.15, z)
    post.castShadow = true
    group.add(post)
    const rope = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.04, 4, 8),
      lambertFlat(COLORS.dustyPeach),
    )
    rope.name = `RopeCoil_${post.name.replace('RopePost_', '')}`
    rope.position.set(x, 0.62, z)
    rope.rotation.x = Math.PI / 2
    group.add(rope)
  }

  // A single low-segment tube reads as a sagging rope rail at scenic distance.
  for (const side of [-1, 1]) {
    const sidePosts = posts
      .filter(([x]) => Math.sign(x) === side)
      .map(([, z]) => z)
    for (let i = 0; i < sidePosts.length - 1; i++) {
      const z0 = sidePosts[i]!
      const z1 = sidePosts[i + 1]!
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * width * 0.42, 0.72, z0),
        new THREE.Vector3(side * width * 0.42, 0.58, (z0 + z1) * 0.5),
        new THREE.Vector3(side * width * 0.42, 0.72, z1),
      ])
      const rail = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 8, 0.022, 4, false),
        lambertFlat(COLORS.rockLight),
      )
      rail.name = `${side < 0 ? 'Port' : 'Starboard'}RopeRail_${i + 1}`
      group.add(rail)
    }
  }

  // Lantern crane (gallows)
  const crane = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 1.85, 0.09),
    darkWood(),
  )
  crane.name = 'LanternCrane'
  crane.position.set(width * 0.38, 1.2, -length * 0.12)
  group.add(crane)
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.07, 0.07), darkWood())
  arm.name = 'LanternArm'
  arm.position.set(width * 0.38 - 0.32, 2.05, -length * 0.12)
  group.add(arm)
  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.26, 0.2),
    new THREE.MeshBasicMaterial({
      color: COLORS.lantern.clone().multiplyScalar(3.6),
      toneMapped: false,
    }),
  )
  lantern.name = 'DockLantern'
  lantern.position.set(width * 0.38 - 0.62, 1.82, -length * 0.12)
  group.add(lantern)

  const footing = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 0),
    lambertVertexColored(COLORS.rockDark),
  )
  footing.name = 'PierFooting'
  footing.position.set(0, -0.15, length * 0.48)
  footing.scale.set(1.5, 0.5, 1.15)
  group.add(footing)

  if (opts?.withStairs) {
    for (let i = 0; i < 4; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.55, 0.1, 0.35),
        darkWood(),
      )
      step.name = `IslandStep_${i + 1}`
      step.position.set(0.15, 0.15 + i * 0.22, -length * 0.52 - i * 0.28)
      step.castShadow = true
      group.add(step)
    }
  }

  return { group }
}

/** Island dock for Scene 2 — shorter pier + stone stairs toward lighthouse. */
export function createIslandDock(): PierHandle {
  return createPier({ length: 4.5, width: 1.55, withStairs: true })
}
