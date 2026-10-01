import type { DeskFocus, GameState, SceneId } from '../types'

/** Pure transitions for the Scene 0–3 flow. */

export function completeIntro(state: GameState): GameState {
  if (state.scene !== 'intro') return state
  return { ...state, scene: 'sail' }
}

export function reachMarker(state: GameState, index: number): GameState {
  if (state.scene !== 'sail') return state
  if (index !== state.markersReached) return state
  const next = state.markersReached + 1
  if (next >= state.markersTotal) {
    return { ...state, markersReached: next, scene: 'dock' }
  }
  return { ...state, markersReached: next }
}

export function completeDock(state: GameState): GameState {
  if (state.scene !== 'dock') return state
  return { ...state, scene: 'desk', beatIndex: 0 }
}

export function openDeskFocus(
  state: GameState,
  focus: Exclude<DeskFocus, null>,
  docId: string | null = null,
): GameState {
  if (state.scene !== 'desk') return state
  return {
    ...state,
    deskFocus: focus,
    activeDocId: focus === 'doc' ? docId : null,
  }
}

export function closeDeskFocus(state: GameState): GameState {
  if (state.scene !== 'desk') return state
  return { ...state, deskFocus: null, activeDocId: null }
}

export function dismissBeat(state: GameState): GameState {
  return { ...state, beatIndex: state.beatIndex + 1 }
}

export function isExterior(scene: SceneId): boolean {
  return scene === 'intro' || scene === 'sail' || scene === 'dock'
}
