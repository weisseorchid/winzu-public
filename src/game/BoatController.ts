/**
 * Floating marker trail from near the boat toward the lighthouse.
 * Final marker triggers the dock cinematic.
 */
import * as THREE from 'three'
import { LAYOUT_WORLD } from '../scene/layout'

const lh = LAYOUT_WORLD.lighthouse
const boat = LAYOUT_WORLD.boat
const white = LAYOUT_WORLD.whiteBuoy
const red = LAYOUT_WORLD.redBuoy

export const MARKER_POSITIONS: [number, number, number][] = (() => {
  const start = new THREE.Vector3(
    THREE.MathUtils.lerp(boat.x, white.x, 0.35),
    0,
    THREE.MathUtils.lerp(boat.z, white.z, 0.35),
  )
  const end = new THREE.Vector3(lh.x + 0.4, 0, lh.z + 2.8)
  const viaA = new THREE.Vector3(white.x, 0, white.z)
  const viaB = new THREE.Vector3(
    THREE.MathUtils.lerp(white.x, red.x, 0.5),
    0,
    THREE.MathUtils.lerp(white.z, red.z, 0.55),
  )
  const viaC = new THREE.Vector3(red.x, 0, red.z)
  const control = [start, viaA, viaB, viaC, end]
  // 5 markers — readable trail without clutter
  const count = 5
  const out: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count
    const scaled = u * (control.length - 1)
    const i0 = Math.floor(scaled)
    const i1 = Math.min(control.length - 1, i0 + 1)
    const f = scaled - i0
    const a = control[i0]!
    const b = control[i1]!
    out.push([
      THREE.MathUtils.lerp(a.x, b.x, f),
      0,
      THREE.MathUtils.lerp(a.z, b.z, f),
    ])
  }
  return out
})()

export const MARKERS_TOTAL = MARKER_POSITIONS.length

/** @deprecated Use MARKER_POSITIONS */
export const WAYPOINT_POSITIONS = MARKER_POSITIONS

export const LIGHTHOUSE_POSITION: [number, number, number] = [lh.x, 0, lh.z]
export const DOCK_POSITION: [number, number, number] = [
  LAYOUT_WORLD.islandDock.x,
  0.15,
  LAYOUT_WORLD.islandDock.z + 0.6,
]
export const START_POSITION: [number, number, number] = [boat.x, 0.15, boat.z]
export const ARRIVE_RADIUS = 2.0
export const SNAP_RADIUS = 6.0

export type BoatState = {
  position: THREE.Vector3
  target: THREE.Vector3 | null
  heading: number
}

export function createBoatState(): BoatState {
  return {
    position: new THREE.Vector3(...START_POSITION),
    target: null,
    heading: Math.atan2(lh.x - boat.x, lh.z - boat.z),
  }
}

function shortestAngleDelta(from: number, to: number) {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

/** Advance boat toward target with smooth yaw. Returns true when arrived. */
export function tickBoat(
  state: BoatState,
  dt: number,
  speed = 4.8,
  turnRate = 3.6,
): boolean {
  if (!state.target) return false
  const to = state.target.clone().sub(state.position)
  to.y = 0
  const dist = to.length()
  if (dist < 0.1) {
    state.position.x = state.target.x
    state.position.z = state.target.z
    state.target = null
    return true
  }

  const desired = Math.atan2(to.x, to.z)
  const delta = shortestAngleDelta(state.heading, desired)
  const maxTurn = turnRate * dt
  state.heading += THREE.MathUtils.clamp(delta, -maxTurn, maxTurn)

  const towardX = to.x / dist
  const towardZ = to.z / dist
  const alongX = Math.sin(state.heading)
  const alongZ = Math.cos(state.heading)
  let mx = towardX * 0.75 + alongX * 0.25
  let mz = towardZ * 0.75 + alongZ * 0.25
  const mLen = Math.hypot(mx, mz) || 1
  const step = Math.min(dist, speed * dt)
  mx = (mx / mLen) * step
  mz = (mz / mLen) * step
  state.position.x += mx
  state.position.z += mz

  return (
    Math.hypot(
      state.target.x - state.position.x,
      state.target.z - state.position.z,
    ) < 0.1
  )
}

export function setBoatTarget(state: BoatState, x: number, z: number) {
  state.target = new THREE.Vector3(x, state.position.y, z)
}

/**
 * Resolve a water click: magnetic snap to the next trail marker,
 * soft-gate so the player cannot skip far past it.
 */
export function resolveSailTarget(
  x: number,
  z: number,
  markersReached: number,
): { x: number; z: number; snapped: boolean } {
  let tx = THREE.MathUtils.clamp(x, -40, 40)
  let tz = z
  let snapped = false

  if (markersReached < MARKER_POSITIONS.length) {
    const wp = MARKER_POSITIONS[markersReached]!
    const d = Math.hypot(tx - wp[0], tz - wp[2])
    if (d < SNAP_RADIUS) {
      tx = wp[0]
      tz = wp[2]
      snapped = true
    } else {
      tz = Math.max(wp[2] - 0.5, tz)
    }
  }

  return { x: tx, z: tz, snapped }
}
