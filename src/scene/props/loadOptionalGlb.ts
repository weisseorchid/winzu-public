/**
 * Optional GLB loaders for girl / pier / desk / lighthouse.
 * Procedural meshes remain default until compressed assets land / flags flip.
 */
import * as THREE from 'three'
import { DESK, GIRL, LIGHTHOUSE, PIER } from '../config'
import { createGlbLoader } from './createGlbLoader'
import { fitGlbWidth, normalizeGlbMaterials } from './normalizeGlb'

function wantsProceduralLighthouse(): boolean {
  if (typeof location === 'undefined') return false
  return new URLSearchParams(location.search).has('proceduralLighthouse')
}

async function tryLoad(
  enabled: boolean,
  path: string,
  opts?: {
    targetWidth?: number
    name?: string
    fog?: boolean
    lanternNameIncludes?: string
  },
): Promise<THREE.Object3D | null> {
  if (!enabled || typeof window === 'undefined') return null
  try {
    const loader = createGlbLoader()
    const url = `${import.meta.env.BASE_URL}${path}`
    const gltf = await loader.loadAsync(url)
    const root = gltf.scene
    if (opts?.name) root.name = opts.name
    normalizeGlbMaterials(root, {
      fog: opts?.fog,
      lanternNameIncludes: opts?.lanternNameIncludes,
    })
    if (opts?.targetWidth != null) {
      fitGlbWidth(root, opts.targetWidth)
    }
    root.updateMatrixWorld(true)
    return root
  } catch (err) {
    console.warn(`[winzu] GLB missing or failed to load (${path}).`, err)
    return null
  }
}

export function loadGirlGlb(): Promise<THREE.Object3D | null> {
  return tryLoad(GIRL.useGlb, GIRL.glbPath, { name: 'GirlGlb' })
}

export function loadPierGlb(): Promise<THREE.Object3D | null> {
  return tryLoad(PIER.useGlb, PIER.glbPath, { name: 'PierGlb' })
}

export function loadDeskGlb(): Promise<THREE.Object3D | null> {
  return tryLoad(DESK.useGlb, DESK.glbPath, { name: 'DeskGlb' })
}

export function loadLighthouseGlb(): Promise<THREE.Object3D | null> {
  if (wantsProceduralLighthouse()) return Promise.resolve(null)
  return tryLoad(LIGHTHOUSE.useGlb, LIGHTHOUSE.glbPath, {
    name: 'LighthouseGlb',
    targetWidth: LIGHTHOUSE.targetWidth,
    fog: true,
    lanternNameIncludes: 'lantern',
  })
}
