import type * as THREE from 'three'
import { LAYOUT, LIGHTHOUSE } from '../../../scene/config'
import { LAYOUT_WORLD, placeAndFit } from '../../../scene/layout'
import { loadBoatGlb } from '../../../scene/props/loadBoatGlb'
import { loadLighthouseGlb } from '../../../scene/props/loadOptionalGlb'
import type { ExteriorVisuals } from './types'

/** Async GLB swaps for boat / lighthouse. Returns cancel callback. */
export function loadExteriorGlbs(
  persp: THREE.PerspectiveCamera,
  visuals: ExteriorVisuals,
): () => void {
  let cancelled = false

  loadBoatGlb().then((obj) => {
    if (cancelled || !obj) return
    visuals.boat.setVisual?.(obj)
    placeAndFit(persp, visuals.boat.group, LAYOUT_WORLD.boat, LAYOUT.boat.width)
  })

  loadLighthouseGlb().then((obj) => {
    if (cancelled || !obj || !LIGHTHOUSE.useGlb) return
    visuals.lighthouse.setVisual(obj)
    placeAndFit(
      persp,
      visuals.lighthouse.group,
      LAYOUT_WORLD.lighthouse,
      LAYOUT.lighthouse.width,
    )
  })

  return () => {
    cancelled = true
  }
}
