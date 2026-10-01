import { useI18n } from '../../i18n'

type Props = {
  docId: string
  onChoose: (optionId: string) => void
  onClose: () => void
  ackOptionId?: string | null
}

/** Zoomed paperwork panel — former sea Q&A content lives here. */
export function DocumentHud({
  docId,
  onChoose,
  onClose,
  ackOptionId = null,
}: Props) {
  const { t } = useI18n()
  const doc = t.documents.find((d) => d.id === docId)
  if (!doc) return null

  return (
    <div
      className="hud-card question-hud document-hud"
      role="dialog"
      aria-labelledby="desk-doc"
    >
      <div className="hud-row">
        <span className="eyebrow">{t.fictionalLabel}</span>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          {t.closeFocus}
        </button>
      </div>
      <h2 id="desk-doc" className="hud-title">
        {doc.title}
      </h2>
      <p className="hud-sub">{doc.body}</p>
      {doc.options && doc.options.length > 0 && (
        <div className="option-grid">
          {doc.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`btn btn-ghost option-btn${ackOptionId === opt.id ? ' active' : ''}`}
              onClick={() => onChoose(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {ackOptionId && (
        <p className="doc-ack" role="status">
          ✓
        </p>
      )}
    </div>
  )
}
