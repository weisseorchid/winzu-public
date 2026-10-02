export type SceneId = 'intro' | 'sail' | 'dock' | 'desk'

export type DeskFocus = null | 'map' | 'doc'

export type GameState = {
  scene: SceneId
  /** How many trail markers the boat has reached (0…markersTotal). */
  markersReached: number
  markersTotal: number
  deskFocus: DeskFocus
  activeDocId: string | null
  selectedNodeId: string | null
  highlightIds: string[]
  beatIndex: number
}

const SCENE_QUERY: Record<string, SceneId> = {
  intro: 'intro',
  scene0: 'intro',
  '0': 'intro',
  sail: 'sail',
  scene1: 'sail',
  '1': 'sail',
  dock: 'dock',
  scene2: 'dock',
  '2': 'dock',
  desk: 'desk',
  scene3: 'desk',
  '3': 'desk',
}

/** Parse ?scene=intro|sail|dock|desk (also scene0–3 aliases). */
export function sceneFromQuery(): SceneId | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('scene')
  if (!raw) return null
  return SCENE_QUERY[raw.toLowerCase()] ?? null
}

export function forceSceneState(
  scene: SceneId,
  markersTotal: number,
): GameState {
  const markersReached = scene === 'dock' || scene === 'desk' ? markersTotal : 0
  return {
    scene,
    markersReached,
    markersTotal,
    deskFocus: null,
    activeDocId: null,
    selectedNodeId: null,
    highlightIds: [],
    beatIndex: 0,
  }
}

export function initialGameState(
  reducedMotion: boolean,
  markersTotal: number,
): GameState {
  const forced = sceneFromQuery()
  if (forced) return forceSceneState(forced, markersTotal)

  if (reducedMotion) {
    return {
      scene: 'sail',
      markersReached: 0,
      markersTotal,
      deskFocus: null,
      activeDocId: null,
      selectedNodeId: null,
      highlightIds: [],
      beatIndex: 0,
    }
  }
  return {
    scene: 'intro',
    markersReached: 0,
    markersTotal,
    deskFocus: null,
    activeDocId: null,
    selectedNodeId: null,
    highlightIds: [],
    beatIndex: 0,
  }
}

export function skipToDesk(markersTotal: number): GameState {
  return {
    scene: 'desk',
    markersReached: markersTotal,
    markersTotal,
    deskFocus: null,
    activeDocId: null,
    selectedNodeId: null,
    highlightIds: [],
    beatIndex: 0,
  }
}
