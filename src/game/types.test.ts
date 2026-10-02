import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  forceSceneState,
  initialGameState,
  sceneFromQuery,
  skipToDesk,
} from './types'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubSearch(search: string) {
  vi.stubGlobal('window', { location: { search } })
}

describe('sceneFromQuery', () => {
  it('returns null when window is unavailable', () => {
    expect(sceneFromQuery()).toBeNull()
  })

  it('returns null when scene param is missing or unknown', () => {
    stubSearch('')
    expect(sceneFromQuery()).toBeNull()
    stubSearch('?foo=bar')
    expect(sceneFromQuery()).toBeNull()
    stubSearch('?scene=unknown')
    expect(sceneFromQuery()).toBeNull()
  })

  it('parses canonical and alias scene ids (case-insensitive)', () => {
    const cases: Array<[string, string]> = [
      ['?scene=intro', 'intro'],
      ['?scene=scene0', 'intro'],
      ['?scene=0', 'intro'],
      ['?scene=SAIL', 'sail'],
      ['?scene=scene1', 'sail'],
      ['?scene=1', 'sail'],
      ['?scene=dock', 'dock'],
      ['?scene=scene2', 'dock'],
      ['?scene=2', 'dock'],
      ['?scene=desk', 'desk'],
      ['?scene=scene3', 'desk'],
      ['?scene=3', 'desk'],
    ]
    for (const [search, scene] of cases) {
      stubSearch(search)
      expect(sceneFromQuery()).toBe(scene)
    }
  })
})

describe('forceSceneState', () => {
  it('zeros markers for intro and sail', () => {
    expect(forceSceneState('intro', 5).markersReached).toBe(0)
    expect(forceSceneState('sail', 5)).toMatchObject({
      scene: 'sail',
      markersReached: 0,
      markersTotal: 5,
      deskFocus: null,
    })
  })

  it('fills markers for dock and desk', () => {
    expect(forceSceneState('dock', 4).markersReached).toBe(4)
    expect(forceSceneState('desk', 4)).toMatchObject({
      scene: 'desk',
      markersReached: 4,
      markersTotal: 4,
    })
  })
})

describe('initialGameState', () => {
  it('honors ?scene= over reducedMotion', () => {
    stubSearch('?scene=desk')
    expect(initialGameState(true, 3)).toMatchObject({
      scene: 'desk',
      markersReached: 3,
    })
  })

  it('starts at sail under reducedMotion when no query', () => {
    stubSearch('')
    expect(initialGameState(true, 3).scene).toBe('sail')
  })

  it('starts at intro by default', () => {
    stubSearch('')
    expect(initialGameState(false, 3).scene).toBe('intro')
  })
})

describe('skipToDesk', () => {
  it('jumps to desk with all markers reached', () => {
    expect(skipToDesk(6)).toMatchObject({
      scene: 'desk',
      markersReached: 6,
      markersTotal: 6,
      deskFocus: null,
    })
  })
})
