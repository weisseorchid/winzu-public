import type * as THREE from 'three'
import type { DeskPropId } from '../../scene/props/Desk'

export type DeskIntent =
  | { kind: 'map' }
  | { kind: 'doc'; docId: string }
  | { kind: 'ignore' }

const DOC_IDS = new Set(['letter_burn', 'letter_renewal', 'letter_copy', 'book'])
const KNOWN = new Set([
  'map',
  'letter_burn',
  'letter_renewal',
  'letter_copy',
  'book',
  'globe',
  'plant',
  'chair',
])

/** Map a picked desk prop id to a HUD intent. */
export function resolveDeskIntent(id: DeskPropId | string): DeskIntent {
  if (id === 'map') return { kind: 'map' }
  if (DOC_IDS.has(id)) {
    return { kind: 'doc', docId: id }
  }
  return { kind: 'ignore' }
}

export function findDeskId(object: THREE.Object3D | null): string | null {
  let cur: THREE.Object3D | null = object
  while (cur) {
    const fromData = cur.userData?.deskId as string | undefined
    if (fromData && KNOWN.has(fromData)) return fromData
    if (cur.name && KNOWN.has(cur.name)) return cur.name
    cur = cur.parent
  }
  return null
}
