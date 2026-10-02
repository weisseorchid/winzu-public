import * as THREE from 'three'
import { COLORS } from '../config'
import { lambertFlat, lambertVertexColored } from '../lighting/LightRig'

export type NormalizeGlbOpts = {
  /** Mesh name substring that forces sail material (boat only). */
  sailNameIncludes?: string
  /** Mesh/material name substring that forces HDR lantern MeshBasic. */
  lanternNameIncludes?: string
  /** Opt-in sun fog for distant props (lighthouse). */
  fog?: boolean
  sunDir?: THREE.Vector3
}

/**
 * Replace imported materials with Lambert flat / vertex-colored so GLBs
 * match the procedural low-poly look (no Standard maps / smooth shading).
 */
export function normalizeGlbMaterials(
  root: THREE.Object3D,
  opts?: NormalizeGlbOpts,
) {
  const sailKey = opts?.sailNameIncludes?.toLowerCase()
  const lanternKey = opts?.lanternNameIncludes?.toLowerCase()
  const fogOpts =
    opts?.fog === true
      ? { fog: true as const, sunDir: opts.sunDir }
      : undefined

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return

    const name = (mesh.name || '').toLowerCase()
    const isSail = sailKey ? name.includes(sailKey) : false

    const srcMats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    const next = srcMats.map((src) => {
      const srcMat = src as THREE.MeshStandardMaterial
      const hasVertexColors = Boolean(mesh.geometry?.getAttribute('color'))
      const matName = (srcMat.name || '').toLowerCase()
      const isLantern = Boolean(
        lanternKey &&
          (name.includes(lanternKey) || matName.includes(lanternKey)),
      )

      if (srcMat.map) {
        srcMat.map.colorSpace = THREE.SRGBColorSpace
      }

      if (isSail) {
        return lambertFlat(COLORS.sailLit, { side: THREE.DoubleSide })
      }

      if (isLantern) {
        const mat = new THREE.MeshBasicMaterial({
          color: COLORS.lantern.clone().multiplyScalar(4.2),
          toneMapped: false,
        })
        return mat
      }

      const color = srcMat.color?.clone?.() ?? COLORS.woodDark.clone()
      if (hasVertexColors) {
        return lambertVertexColored(0xffffff, fogOpts)
      }
      return lambertFlat(color, fogOpts)
    })

    mesh.material = next.length === 1 ? next[0]! : next
    mesh.castShadow = false
    mesh.receiveShadow = false
  })
}

/** Uniform scale so the bounding-box width matches `targetWidth`; keel at y≈0. */
export function fitGlbWidth(root: THREE.Object3D, targetWidth: number) {
  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  box.getSize(size)
  const w = Math.max(size.x, 0.001)
  const s = targetWidth / w
  root.scale.multiplyScalar(s)
  box.setFromObject(root)
  root.position.y -= box.min.y
}
