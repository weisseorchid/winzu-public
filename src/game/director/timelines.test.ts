import { describe, expect, it } from 'vitest'
import {
  DOCK,
  INTRO,
  dockPhase,
  introPhase,
  segmentProgress,
} from './timelines'

describe('introPhase', () => {
  it('returns look, walk, board, then done across INTRO bounds', () => {
    expect(introPhase(0)).toBe('look')
    expect(introPhase(INTRO.look - 0.001)).toBe('look')
    expect(introPhase(INTRO.look)).toBe('walk')
    expect(introPhase(INTRO.look + INTRO.walk - 0.001)).toBe('walk')
    expect(introPhase(INTRO.look + INTRO.walk)).toBe('board')
    expect(introPhase(INTRO.total - 0.001)).toBe('board')
    expect(introPhase(INTRO.total)).toBe('done')
    expect(introPhase(INTRO.total + 10)).toBe('done')
  })
})

describe('dockPhase', () => {
  it('returns approach, exit, establish, then done across DOCK bounds', () => {
    expect(dockPhase(0)).toBe('approach')
    expect(dockPhase(DOCK.approach - 0.001)).toBe('approach')
    expect(dockPhase(DOCK.approach)).toBe('exit')
    expect(dockPhase(DOCK.approach + DOCK.exit - 0.001)).toBe('exit')
    expect(dockPhase(DOCK.approach + DOCK.exit)).toBe('establish')
    expect(dockPhase(DOCK.total - 0.001)).toBe('establish')
    expect(dockPhase(DOCK.total)).toBe('done')
    expect(dockPhase(DOCK.total + 10)).toBe('done')
  })
})

describe('segmentProgress', () => {
  it('is 0 before start and 1 after the segment', () => {
    expect(segmentProgress(0, 1, 2)).toBe(0)
    expect(segmentProgress(1, 1, 2)).toBe(0)
    expect(segmentProgress(3, 1, 2)).toBe(1)
    expect(segmentProgress(4, 1, 2)).toBe(1)
  })

  it('smoothsteps in the middle of the segment', () => {
    const mid = segmentProgress(2, 1, 2)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
    // smoothstep(0.5) = 0.5
    expect(mid).toBeCloseTo(0.5, 5)
  })

  it('handles non-positive duration', () => {
    expect(segmentProgress(0, 1, 0)).toBe(0)
    expect(segmentProgress(1, 1, 0)).toBe(1)
    expect(segmentProgress(0, 1, -1)).toBe(0)
    expect(segmentProgress(1, 1, -1)).toBe(1)
  })
})
