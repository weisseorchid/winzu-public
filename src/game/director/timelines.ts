/** Duration (seconds) for scripted exterior cinematics. */

export const INTRO = {
  /** Hold on pier / girl looking at lighthouse. */
  look: 3.2,
  /** Walk from pier end toward boat. */
  walk: 3.4,
  /** Board / settle in boat. */
  board: 1.8,
  total: 3.2 + 3.4 + 1.8,
} as const

export const DOCK = {
  /** Auto approach island pier. */
  approach: 4.6,
  /** Girl steps onto dock. */
  exit: 2.6,
  /** Establish lighthouse, then cut. */
  establish: 2.0,
  total: 4.6 + 2.6 + 2.0,
} as const

export function introPhase(t: number): 'look' | 'walk' | 'board' | 'done' {
  if (t < INTRO.look) return 'look'
  if (t < INTRO.look + INTRO.walk) return 'walk'
  if (t < INTRO.total) return 'board'
  return 'done'
}

export function dockPhase(
  t: number,
): 'approach' | 'exit' | 'establish' | 'done' {
  if (t < DOCK.approach) return 'approach'
  if (t < DOCK.approach + DOCK.exit) return 'exit'
  if (t < DOCK.total) return 'establish'
  return 'done'
}

/** Smoothstep 0→1 within [start, start+dur] of absolute time t. */
export function segmentProgress(
  t: number,
  start: number,
  dur: number,
): number {
  if (dur <= 0) return t >= start ? 1 : 0
  const u = (t - start) / dur
  if (u <= 0) return 0
  if (u >= 1) return 1
  return u * u * (3 - 2 * u)
}
