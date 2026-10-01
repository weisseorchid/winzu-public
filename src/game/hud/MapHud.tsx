import { useI18n } from '../../i18n'
import { barNorte, type GraphNode } from '../../data/barNorte'
import type { AskResult } from '../../data/ask'
import { mailtoHref, site } from '../../site'

type Props = {
  beatIndex: number
  onDismissBeat: () => void
  selected: GraphNode | null
  highlightIds: string[]
  askResult: AskResult | null
  onSelect: (id: string) => void
  onAsk: (presetId: string) => void
  onClose: () => void
}

/** DOM panel for the living Bar Norte map (opened from the desk map). */
export function MapHud({
  beatIndex,
  onDismissBeat,
  selected,
  highlightIds,
  askResult,
  onSelect,
  onAsk,
  onClose,
}: Props) {
  const { locale, t } = useI18n()
  const beat = t.beats[beatIndex]
  const sourceForSelected = selected
    ? barNorte.sources.find((s) => s.id === selected.sourceId)
    : null

  return (
    <div className="lit-hud desk-map-hud">
      {beat && (
        <div className="hud-card beat-card" role="status">
          <p>{beat}</p>
          <button
            type="button"
            className="btn btn-cinnabar"
            onClick={onDismissBeat}
          >
            →
          </button>
        </div>
      )}

      <aside className="hud-card map-hud">
        <div className="hud-row">
          <span className="eyebrow">{t.fictionalLabel}</span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t.closeFocus}
          </button>
        </div>
        <h2 className="hud-title-sm">{t.map.title}</h2>
        <p className="hud-sub">{t.map.subtitle}</p>

        <strong className="ask-label">{t.map.askPrompt}</strong>
        <div className="ask-presets">
          {t.map.presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={askResult?.presetId === p.id ? 'active' : undefined}
              onClick={() => onAsk(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {askResult && (
          <div className="answer-box" role="status">
            <p>{askResult.summary[locale]}</p>
            {askResult.sources.map((s) => (
              <div key={s.id} className="citation">
                <strong>
                  {t.map.source}: {s.title[locale]}
                </strong>
                <span>{s.snippet[locale]}</span>
              </div>
            ))}
          </div>
        )}

        <ul className="node-list compact">
          {barNorte.nodes.map((node) => {
            const active = selected?.id === node.id
            const pulse = highlightIds.includes(node.id)
            return (
              <li key={node.id}>
                <button
                  type="button"
                  className={`${active ? 'active' : ''} ${pulse ? 'pulse' : ''}`}
                  onClick={() => onSelect(node.id)}
                >
                  <span className="node-type">
                    {t.map.nodeTypes[node.type]}
                  </span>
                  <div>{node.label[locale]}</div>
                </button>
              </li>
            )
          })}
        </ul>

        {selected && (
          <div className="detail-card">
            <span className="node-type">{t.map.nodeTypes[selected.type]}</span>
            <h4>{selected.label[locale]}</h4>
            <p>{selected.detail[locale]}</p>
            {sourceForSelected && (
              <div className="citation">
                <strong>
                  {t.map.source}: {sourceForSelected.title[locale]}
                </strong>
                <span>{sourceForSelected.snippet[locale]}</span>
              </div>
            )}
          </div>
        )}
      </aside>

      <div className="shore-cta hud-card">
        <h3 className="hud-title-sm">{t.cta.title}</h3>
        <p className="hud-sub">{t.cta.body}</p>
        <div className="cta-actions">
          <a className="btn btn-cinnabar" href={mailtoHref()}>
            {t.cta.mail}
          </a>
          <a
            className="btn btn-lamp"
            href={site.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.cta.calendly}
          </a>
        </div>
        <p className="footer-line">{t.footer}</p>
      </div>
    </div>
  )
}
