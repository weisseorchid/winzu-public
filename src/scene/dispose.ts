import * as THREE from 'three'

/** Standard material map slots that may hold GPU textures. */
const TEXTURE_KEYS = [
  'map',
  'lightMap',
  'bumpMap',
  'normalMap',
  'specularMap',
  'envMap',
  'alphaMap',
  'aoMap',
  'displacementMap',
  'emissiveMap',
  'metalnessMap',
  'roughnessMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'transmissionMap',
  'thicknessMap',
  'specularIntensityMap',
  'specularColorMap',
] as const

function disposeTexture(tex: unknown, seen: Set<THREE.Texture>) {
  if (!(tex instanceof THREE.Texture) || seen.has(tex)) return
  seen.add(tex)
  tex.dispose()
}

function disposeMaterial(
  mat: THREE.Material,
  seenMats: Set<THREE.Material>,
  seenTex: Set<THREE.Texture>,
) {
  if (seenMats.has(mat)) return
  seenMats.add(mat)
  for (const key of TEXTURE_KEYS) {
    disposeTexture((mat as unknown as Record<string, unknown>)[key], seenTex)
  }
  mat.dispose()
}

/**
 * Traverse an Object3D tree and dispose geometries, materials, textures, and
 * light shadow maps. Shared materials/textures are disposed once.
 *
 * Does not dispose render-target textures held only via shader uniforms
 * (e.g. ocean reflection map) — those stay owned by their pass.
 */
export function disposeObject3D(root: THREE.Object3D): void {
  const seenMats = new Set<THREE.Material>()
  const seenTex = new Set<THREE.Texture>()
  const seenGeo = new Set<THREE.BufferGeometry>()

  root.traverse((obj) => {
    const udMat = obj.userData?.material as THREE.Material | undefined
    if (udMat) disposeMaterial(udMat, seenMats, seenTex)

    const light = obj as THREE.Light
    if (light.isLight && light.shadow?.map) {
      light.shadow.map.dispose()
      light.shadow.map = null as unknown as THREE.WebGLRenderTarget
    }

    const mesh = obj as THREE.Mesh
    const isDrawable =
      mesh.isMesh ||
      (obj as THREE.Line).isLine ||
      (obj as THREE.Points).isPoints
    if (!isDrawable) return

    if (mesh.geometry && !seenGeo.has(mesh.geometry)) {
      seenGeo.add(mesh.geometry)
      mesh.geometry.dispose()
    }

    if (!mesh.material) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) {
      if (m) disposeMaterial(m, seenMats, seenTex)
    }
  })
}
