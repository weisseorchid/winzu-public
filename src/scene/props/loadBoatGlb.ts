import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BOAT, COLORS } from '../config'
import { lambertFlat, lambertVertexColored } from '../lighting/LightRig'

function wantsProceduralBoat(): boolean {
  if (typeof location === 'undefined') return false
  return new URLSearchParams(location.search).has('proceduralBoat')
}

function normalizeMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return

    const name = (mesh.name || '').toLowerCase()
    const isSail = name.includes('sail')

    const srcMats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    const next = srcMats.map((src) => {
      const srcMat = src as THREE.MeshStandardMaterial
      const hasVertexColors = Boolean(mesh.geometry?.getAttribute('color'))

      if (srcMat.map) {
        srcMat.map.colorSpace = THREE.SRGBColorSpace
      }

      if (isSail) {
        return lambertFlat(COLORS.sailLit, { side: THREE.DoubleSide })
      }

      const color = srcMat.color?.clone?.() ?? COLORS.woodDark.clone()
      if (hasVertexColors) {
        return lambertVertexColored(0xffffff)
      }
      return lambertFlat(color)
    })

    mesh.material = next.length === 1 ? next[0]! : next
    mesh.castShadow = false
    mesh.receiveShadow = false
  })
}

function fitWidth(root: THREE.Object3D, targetWidth: number) {
  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  box.getSize(size)
  const w = Math.max(size.x, 0.001)
  const s = targetWidth / w
  root.scale.multiplyScalar(s)
  // Sit keel near y=0
  box.setFromObject(root)
  root.position.y -= box.min.y
}

/**
 * Load the stylized boat GLB. Returns null on failure / forced procedural.
 * Never throws — callers keep the procedural boat as fallback.
 */
export async function loadBoatGlb(): Promise<THREE.Object3D | null> {
  if (!BOAT.useGlb || wantsProceduralBoat()) return null

  const url = `${import.meta.env.BASE_URL}${BOAT.glbPath}`
  const loader = new GLTFLoader()

  try {
    const gltf = await loader.loadAsync(url)
    const root = gltf.scene
    root.name = 'BoatGlb'

    // Orient bow toward −Z if the asset faces +Z / +X
    root.rotation.y = Math.PI

    normalizeMaterials(root)
    fitWidth(root, BOAT.targetWidth)
    root.updateMatrixWorld(true)
    return root
  } catch (err) {
    console.warn(
      `[winzu] Boat GLB missing or failed to load (${url}). Using procedural boat.`,
      err,
    )
    return null
  }
}
