import * as THREE from 'three'
import { COLORS } from '../config'
import { lambertFlat } from '../lighting/LightRig'

export type GirlHandle = {
  group: THREE.Group
  setPose: (pose: GirlPose) => void
  update: (t: number, reducedMotion?: boolean) => void
}

export type GirlPose = 'idle' | 'look' | 'walk' | 'sit' | 'step'

function namedMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function limb(
  name: string,
  length: number,
  radius: number,
  material: THREE.Material,
) {
  const mesh = namedMesh(
    name,
    new THREE.CylinderGeometry(radius * 0.84, radius, length, 5),
    material,
  )
  mesh.position.y = -length * 0.5
  return mesh
}

/**
 * Articulated low-poly heroine matching objects/girl.png. The visual is kept
 * as named, separate parts so a future animator can replace individual limbs
 * or attach interaction markers without changing the scene director.
 */
export function createGirl(): GirlHandle {
  const group = new THREE.Group()
  group.name = 'Girl'
  group.userData.asset = 'girl'

  const rig = new THREE.Group()
  rig.name = 'GirlRig'
  group.add(rig)

  const skin = lambertFlat(COLORS.skyNearSun)
  const blouse = lambertFlat(COLORS.offWhite)
  const blouseShade = lambertFlat(COLORS.dustyPeach)
  const sash = lambertFlat(COLORS.sailLit)
  const skirt = lambertFlat(COLORS.blueGrey)
  const skirtShade = lambertFlat(COLORS.oceanLight)
  const hair = lambertFlat(COLORS.woodDark)
  const hairLit = lambertFlat(COLORS.wood)
  const ribbon = lambertFlat(COLORS.sail)

  // Feet and legs establish a believable stance before the skirt silhouette.
  for (const side of [-1, 1]) {
    const legPivot = new THREE.Group()
    legPivot.name = side < 0 ? 'LegLeft' : 'LegRight'
    legPivot.position.set(side * 0.075, 0.5, 0)
    legPivot.add(limb('LowerLeg', 0.42, 0.055, skin))
    const foot = namedMesh(
      'BareFoot',
      new THREE.ConeGeometry(0.085, 0.25, 5),
      skin,
    )
    foot.rotation.z = Math.PI / 2
    foot.position.set(0, -0.43, -0.065)
    legPivot.add(foot)
    rig.add(legPivot)
  }

  const skirtPivot = new THREE.Group()
  skirtPivot.name = 'Skirt'
  skirtPivot.position.y = 0.72
  const skirtMesh = namedMesh(
    'SkirtBody',
    new THREE.CylinderGeometry(0.19, 0.43, 0.72, 9, 1, false),
    skirt,
  )
  skirtMesh.position.y = -0.32
  skirtPivot.add(skirtMesh)
  // Offset panels give the hem the wind-swept, layered read of the reference.
  for (let i = 0; i < 4; i++) {
    const a = -0.55 + i * 0.36
    const panel = namedMesh(
      `SkirtPanel_${i + 1}`,
      new THREE.ConeGeometry(0.18, 0.52, 4),
      i % 2 ? skirtShade : skirt,
    )
    panel.scale.set(0.72, 1, 0.52)
    panel.position.set(Math.sin(a) * 0.18, -0.37, Math.cos(a) * 0.12)
    panel.rotation.y = a
    skirtPivot.add(panel)
  }
  rig.add(skirtPivot)

  const torso = new THREE.Group()
  torso.name = 'Torso'
  torso.position.y = 0.88
  const blouseBody = namedMesh(
    'Blouse',
    new THREE.CylinderGeometry(0.19, 0.24, 0.42, 6),
    blouse,
  )
  blouseBody.position.y = 0.18
  torso.add(blouseBody)
  const belt = namedMesh(
    'RedSash',
    new THREE.CylinderGeometry(0.25, 0.25, 0.1, 7),
    sash,
  )
  belt.position.y = -0.015
  torso.add(belt)
  const knot = namedMesh(
    'SashKnot',
    new THREE.IcosahedronGeometry(0.07, 0),
    sash,
  )
  knot.position.set(0.23, -0.01, 0.06)
  torso.add(knot)
  const sashTail = namedMesh(
    'SashTail',
    new THREE.ConeGeometry(0.06, 0.44, 4),
    ribbon,
  )
  sashTail.position.set(0.29, -0.22, 0.075)
  sashTail.rotation.z = 0.45
  torso.add(sashTail)
  rig.add(torso)

  const armPivots: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.name = side < 0 ? 'ArmLeft' : 'ArmRight'
    arm.position.set(side * 0.24, 1.18, 0)
    const sleeve = namedMesh(
      'PuffedSleeve',
      new THREE.CylinderGeometry(0.1, 0.15, 0.29, 6),
      blouse,
    )
    sleeve.position.y = -0.12
    arm.add(sleeve)
    const cuff = namedMesh(
      'Cuff',
      new THREE.CylinderGeometry(0.075, 0.08, 0.05, 6),
      blouseShade,
    )
    cuff.position.y = -0.28
    arm.add(cuff)
    const forearm = limb('Forearm', 0.25, 0.052, skin)
    forearm.position.y = -0.34
    arm.add(forearm)
    const hand = namedMesh(
      'Hand',
      new THREE.IcosahedronGeometry(0.065, 0),
      skin,
    )
    hand.position.y = -0.49
    arm.add(hand)
    torso.add(arm)
    armPivots.push(arm)
  }

  const neck = namedMesh(
    'Neck',
    new THREE.CylinderGeometry(0.07, 0.08, 0.14, 6),
    skin,
  )
  neck.position.y = 1.39
  torso.add(neck)
  const headPivot = new THREE.Group()
  headPivot.name = 'Head'
  headPivot.position.y = 1.55
  const head = namedMesh('Face', new THREE.IcosahedronGeometry(0.15, 1), skin)
  head.scale.set(0.88, 1.08, 0.9)
  headPivot.add(head)
  const hairCap = namedMesh(
    'HairCap',
    new THREE.IcosahedronGeometry(0.175, 1),
    hair,
  )
  hairCap.scale.set(1.03, 0.88, 1.04)
  hairCap.position.set(0, 0.055, 0.015)
  headPivot.add(hairCap)
  const fringe = namedMesh(
    'HairFringe',
    new THREE.ConeGeometry(0.11, 0.22, 5),
    hairLit,
  )
  fringe.position.set(-0.075, -0.02, -0.12)
  fringe.rotation.x = Math.PI / 2.2
  headPivot.add(fringe)
  torso.add(headPivot)

  const hairRoot = new THREE.Group()
  hairRoot.name = 'WindblownHair'
  hairRoot.position.set(0.02, 1.52, 0.12)
  const hairLocks: THREE.Mesh[] = []
  for (let i = 0; i < 6; i++) {
    const lock = namedMesh(
      `HairLock_${i + 1}`,
      new THREE.ConeGeometry(0.06, 0.65 - i * 0.035, 4),
      i % 2 ? hairLit : hair,
    )
    lock.position.set((i - 2.5) * 0.05, -0.23, 0.08 + Math.abs(i - 2.5) * 0.018)
    lock.rotation.z = -0.55 - i * 0.055
    lock.rotation.x = 1.36
    hairRoot.add(lock)
    hairLocks.push(lock)
  }
  const bow = new THREE.Group()
  bow.name = 'HairRibbon'
  bow.position.set(0.03, 0.02, 0.13)
  for (const side of [-1, 1]) {
    const loop = namedMesh(
      'RibbonLoop',
      new THREE.ConeGeometry(0.075, 0.2, 4),
      ribbon,
    )
    loop.rotation.z = (side * Math.PI) / 2
    loop.position.x = side * 0.08
    bow.add(loop)
  }
  const ribbonTail = namedMesh(
    'RibbonTail',
    new THREE.ConeGeometry(0.045, 0.32, 4),
    ribbon,
  )
  ribbonTail.position.set(-0.08, -0.18, 0.025)
  ribbonTail.rotation.z = -0.52
  bow.add(ribbonTail)
  hairRoot.add(bow)
  torso.add(hairRoot)

  let pose: GirlPose = 'idle'
  let baseY = 0
  const legs = rig.children.filter((child) => child.name.startsWith('Leg'))

  const resetPose = () => {
    for (const limbPivot of [...legs, ...armPivots]) limbPivot.rotation.x = 0
    torso.rotation.set(0, 0, 0)
    group.rotation.y = 0
    headPivot.rotation.y = 0
    skirtPivot.scale.set(1, 1, 1)
  }

  return {
    group,
    setPose(nextPose) {
      pose = nextPose
      resetPose()
      baseY = 0
      if (pose === 'look') {
        group.rotation.y = -0.45
        headPivot.rotation.y = -0.3
        armPivots[1]!.rotation.x = -0.18
      } else if (pose === 'sit') {
        baseY = -0.13
        skirtPivot.scale.y = 0.78
        legs.forEach((leg) => (leg.rotation.x = 0.72))
        torso.rotation.x = -0.08
      } else if (pose === 'step') {
        legs[0]!.rotation.x = 0.58
        legs[1]!.rotation.x = -0.3
        armPivots[0]!.rotation.x = -0.3
        armPivots[1]!.rotation.x = 0.2
      }
      group.position.y = baseY
    },
    update(t, reducedMotion) {
      if (reducedMotion) return
      if (pose === 'idle' || pose === 'look') {
        group.position.y = baseY + Math.sin(t * 1.5) * 0.01
      }
      if (pose === 'walk') {
        const swing = Math.sin(t * 7.5) * 0.5
        legs[0]!.rotation.x = swing
        legs[1]!.rotation.x = -swing
        armPivots[0]!.rotation.x = -swing * 0.55
        armPivots[1]!.rotation.x = swing * 0.55
      }
      hairLocks.forEach((lock, index) => {
        lock.rotation.z =
          -0.55 - index * 0.055 + Math.sin(t * 2.2 + index) * 0.09
      })
      bow.rotation.z = Math.sin(t * 3.2) * 0.08
    },
  }
}
