import * as THREE from 'three'
import { BOAT } from '../config'
import { createGlbLoader } from './createGlbLoader'
import { fitGlbWidth, normalizeGlbMaterials } from './normalizeGlb'

function wantsProceduralBoat(): boolean {
  if (typeof location === 'undefined') return false
  return new URLSearchParams(location.search).has('proceduralBoat')
}

/**
 * Load the stylized boat GLB. Returns null on failure / forced procedural.
 * Never throws — callers keep the procedural boat as fallback.
 */
export async function loadBoatGlb(): Promise<THREE.Object3D | null> {
  if (!BOAT.useGlb || wantsProceduralBoat()) return null

  const url = `${import.meta.env.BASE_URL}${BOAT.glbPath}`
  const loader = createGlbLoader()

  try {
    const gltf = await loader.loadAsync(url)
    const root = gltf.scene
    root.name = 'BoatGlb'

    // Orient bow toward −Z if the asset faces +Z / +X
    root.rotation.y = Math.PI

    normalizeGlbMaterials(root, { sailNameIncludes: 'sail' })
    fitGlbWidth(root, BOAT.targetWidth)
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
