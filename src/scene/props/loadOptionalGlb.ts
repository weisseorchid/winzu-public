/**
 * Optional GLB loaders for girl / pier / desk / lighthouse.
 * Procedural meshes remain default until compressed assets land.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DESK, GIRL, LIGHTHOUSE, PIER } from '../config'

async function tryLoad(
  enabled: boolean,
  path: string,
): Promise<THREE.Object3D | null> {
  if (!enabled || typeof window === 'undefined') return null
  try {
    const loader = new GLTFLoader()
    const url = `${import.meta.env.BASE_URL}${path}`
    const gltf = await loader.loadAsync(url)
    return gltf.scene
  } catch {
    return null
  }
}

export function loadGirlGlb(): Promise<THREE.Object3D | null> {
  return tryLoad(GIRL.useGlb, GIRL.glbPath)
}

export function loadPierGlb(): Promise<THREE.Object3D | null> {
  return tryLoad(PIER.useGlb, PIER.glbPath)
}

export function loadDeskGlb(): Promise<THREE.Object3D | null> {
  return tryLoad(DESK.useGlb, DESK.glbPath)
}

export function loadLighthouseGlb(): Promise<THREE.Object3D | null> {
  return tryLoad(LIGHTHOUSE.useGlb, LIGHTHOUSE.glbPath)
}
