import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useI18n } from '../i18n'
import { usePrefersReducedMotion } from '../hooks'
import { barNorte, type GraphNode } from '../data/barNorte'
import { answerPreset, type AskResult } from '../data/ask'
import { MapHud } from './hud/MapHud'
import { DocumentHud } from './hud/DocumentHud'
import {
  completeDock,
  completeIntro,
  closeDeskFocus,
  dismissBeat,
  isExterior,
  openDeskFocus,
  reachMarker,
} from './director/SceneDirector'
import { MARKERS_TOTAL } from './BoatController'
import { initialGameState, skipToDesk, type GameState } from './types'

const ExteriorScene = lazy(() =>
  import('./scenes/ExteriorScene').then((m) => ({ default: m.ExteriorScene })),
)
const Scene3Desk = lazy(() =>
  import('./scenes/Scene3Desk').then((m) => ({ default: m.Scene3Desk })),
)

export function Game() {
  const { t } = useI18n()
  const reducedMotion = usePrefersReducedMotion()
  const [state, setState] = useState<GameState>(() =>
    initialGameState(reducedMotion, MARKERS_TOTAL),
  )
  const [askResult, setAskResult] = useState<AskResult | null>(null)
  const [docAck, setDocAck] = useState<string | null>(null)
  const [fade, setFade] = useState(0)

  const selected: GraphNode | null = useMemo(
    () => barNorte.nodes.find((n) => n.id === state.selectedNodeId) ?? null,
    [state.selectedNodeId],
  )

  const onIntroComplete = useCallback(() => {
    setState((s) => completeIntro(s))
  }, [])

  const onReachMarker = useCallback((index: number) => {
    setState((s) => reachMarker(s, index))
  }, [])

  const onDockComplete = useCallback(() => {
    if (reducedMotion) {
      setState((s) => completeDock(s))
      return
    }
    setFade(1)
    window.setTimeout(() => {
      setState((s) => completeDock(s))
      window.setTimeout(() => setFade(0), 80)
    }, 420)
  }, [reducedMotion])

  const onSkip = useCallback(() => {
    setState(skipToDesk(MARKERS_TOTAL))
  }, [])

  const onOpenMap = useCallback(() => {
    setDocAck(null)
    setState((s) => openDeskFocus(s, 'map'))
  }, [])

  const onOpenDoc = useCallback((docId: string) => {
    setDocAck(null)
    setState((s) => openDeskFocus(s, 'doc', docId))
  }, [])

  const onCloseFocus = useCallback(() => {
    setState((s) => closeDeskFocus(s))
    setAskResult(null)
    setDocAck(null)
  }, [])

  const onDismissBeat = useCallback(() => {
    setState((s) => dismissBeat(s))
  }, [])

  const onSelectNode = useCallback((id: string) => {
    setState((s) => ({ ...s, selectedNodeId: id }))
  }, [])

  const onAsk = useCallback((presetId: string) => {
    const result = answerPreset(
      barNorte,
      presetId,
      new Date('2026-09-28T12:00:00Z'),
    )
    setAskResult(result)
    setState((s) => ({
      ...s,
      highlightIds: result.nodeIds,
      selectedNodeId: result.nodeIds[0] ?? s.selectedNodeId,
    }))
  }, [])

  const onDocChoose = useCallback((optionId: string) => {
    setDocAck(optionId)
  }, [])

  // Fade out when entering desk from dock
  useEffect(() => {
    if (state.scene === 'desk' && fade > 0) {
      const id = window.setTimeout(() => setFade(0), 50)
      return () => window.clearTimeout(id)
    }
  }, [state.scene, fade])

  const exterior = isExterior(state.scene)

  return (
    <div className="game-root">
      <div
        className="game-canvas"
        style={{
          opacity: fade > 0.5 ? 0 : 1,
          transition: reducedMotion ? 'none' : 'opacity 0.4s ease',
        }}
      >
        <Suspense fallback={<div className="game-fallback" />}>
          {exterior ? (
            <ExteriorScene
              scene={state.scene}
              markersReached={state.markersReached}
              onReachMarker={onReachMarker}
              onIntroComplete={onIntroComplete}
              onDockComplete={onDockComplete}
              reducedMotion={reducedMotion}
            />
          ) : (
            <Scene3Desk
              deskFocus={state.deskFocus}
              selectedId={state.selectedNodeId}
              highlightIds={state.highlightIds}
              onSelectNode={onSelectNode}
              onOpenMap={onOpenMap}
              onOpenDoc={onOpenDoc}
              onCloseFocus={onCloseFocus}
            />
          )}
        </Suspense>
      </div>

      <div
        className="scene-fade"
        aria-hidden
        style={{
          opacity: fade,
          pointerEvents: fade > 0.1 ? 'auto' : 'none',
        }}
      />

      <div className="game-hud">
        {state.scene === 'sail' && <p className="hint-pill">{t.clickHint}</p>}
        {state.scene === 'desk' && !state.deskFocus && (
          <p className="hint-pill">{t.deskHint}</p>
        )}

        {state.scene === 'desk' && state.deskFocus === 'map' && (
          <MapHud
            beatIndex={state.beatIndex}
            onDismissBeat={onDismissBeat}
            selected={selected}
            highlightIds={state.highlightIds}
            askResult={askResult}
            onSelect={onSelectNode}
            onAsk={onAsk}
            onClose={onCloseFocus}
          />
        )}

        {state.scene === 'desk' &&
          state.deskFocus === 'doc' &&
          state.activeDocId && (
            <DocumentHud
              docId={state.activeDocId}
              onChoose={onDocChoose}
              onClose={onCloseFocus}
              ackOptionId={docAck}
            />
          )}

        {state.scene !== 'desk' && (
          <button type="button" className="skip-lamp" onClick={onSkip}>
            {t.skipToDesk}
          </button>
        )}
      </div>
    </div>
  )
}
