import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import Markdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import remarkGfm from 'remark-gfm'
import { LanguageSwitch } from '../components/LanguageSwitch/LanguageSwitch'
import { isLegalId, loadLegal, type LegalId } from '../content/legal/loadLegal'
import {
  slugHeading,
  type LegalHeading,
  type ParsedLegal,
} from '../content/legal/parseLegal'
import type { Locale } from '../i18n'
import { closeLegalHash, hashLegalId, openLegalHash } from './legalHash'
import './LegalDialog.css'

function flattenText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return flattenText(
      (node as ReactElement<{ children?: ReactNode }>).props.children,
    )
  }
  return ''
}

function formatUpdated(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const tag = locale.startsWith('es') ? 'es-ES' : 'en-GB'
  return new Intl.DateTimeFormat(tag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function MarkdownBody({
  doc,
  onLegalLink,
}: {
  doc: ParsedLegal
  onLegalLink: (id: LegalId) => void
}) {
  const idLookup = useMemo(() => {
    const counts = new Map<string, number>()
    const map = new Map<string, string>()
    for (const h of doc.headings) {
      const key = `${h.depth}:${h.text}`
      const n = counts.get(key) ?? 0
      counts.set(key, n + 1)
      map.set(`${key}:${n}`, h.id)
    }
    return map
  }, [doc.headings])

  const seen = new Map<string, number>()

  const headingId = (depth: 2 | 3, children: ReactNode) => {
    const text = flattenText(children)
    const key = `${depth}:${text}`
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    return idLookup.get(`${key}:${n}`) ?? slugHeading(text)
  }

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2({ children }) {
          return <h2 id={headingId(2, children)}>{children}</h2>
        },
        h3({ children }) {
          return <h3 id={headingId(3, children)}>{children}</h3>
        },
        a({ href, children }) {
          const hash = href?.startsWith('#') ? href.slice(1) : null
          if (hash && isLegalId(hash)) {
            return (
              <a
                href={`#${hash}`}
                onClick={(e) => {
                  e.preventDefault()
                  onLegalLink(hash)
                }}
              >
                {children}
              </a>
            )
          }
          if (hash) {
            return (
              <a
                href={`#${hash}`}
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById(hash)
                    ?.scrollIntoView({ block: 'start' })
                }}
              >
                {children}
              </a>
            )
          }
          const external = Boolean(href && /^https?:/i.test(href))
          return (
            <a
              href={href}
              {...(external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {children}
            </a>
          )
        },
      }}
    >
      {doc.body}
    </Markdown>
  )
}

export function LegalDialog() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? 'en') as Locale
  const dialogRef = useRef<HTMLDialogElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const [docId, setDocId] = useState<LegalId | null>(() =>
    typeof window === 'undefined' ? null : hashLegalId(),
  )
  const [loaded, setLoaded] = useState<{
    key: string
    doc: ParsedLegal
  } | null>(null)
  const [failed, setFailed] = useState<{
    key: string
    message: string
  } | null>(null)
  const [activeHeading, setActiveHeading] = useState<string | null>(null)

  const requestKey = docId ? `${locale}:${docId}` : null
  const doc = requestKey && loaded?.key === requestKey ? loaded.doc : null
  const error = requestKey && failed?.key === requestKey ? failed.message : null
  const showLoading = Boolean(requestKey) && !doc && !error
  const showDoc = Boolean(doc)

  useEffect(() => {
    const sync = () => setDocId(hashLegalId())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (docId) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [docId])

  useEffect(() => {
    if (!docId || !requestKey) return
    let cancelled = false
    void loadLegal(locale, docId)
      .then((parsed) => {
        if (cancelled) return
        setLoaded({ key: requestKey, doc: parsed })
        setFailed(null)
        setActiveHeading(parsed.headings.find((h) => h.depth === 2)?.id ?? null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setFailed({
          key: requestKey,
          message: err instanceof Error ? err.message : 'Failed to load',
        })
      })
    return () => {
      cancelled = true
    }
  }, [docId, locale, requestKey])

  useEffect(() => {
    const root = articleRef.current
    if (!root || !doc) return
    const headings = Array.from(root.querySelectorAll<HTMLElement>('h2[id]'))
    if (headings.length === 0) return

    const scrollRoot = dialogRef.current?.querySelector('.legal-scroll') ?? null
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) {
          setActiveHeading(visible[0].target.id)
        }
      },
      {
        root: scrollRoot,
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 1],
      },
    )
    for (const h of headings) observer.observe(h)
    return () => observer.disconnect()
  }, [doc])

  const toc: LegalHeading[] = useMemo(
    () => doc?.headings.filter((h) => h.depth === 2) ?? [],
    [doc],
  )

  const onClose = useCallback(() => {
    closeLegalHash()
  }, [])

  const onDialogClose = useCallback(() => {
    if (hashLegalId()) closeLegalHash()
  }, [])

  const onBackdropClick = useCallback(
    (e: ReactMouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose()
    },
    [onClose],
  )

  const switchDoc = useCallback((id: LegalId) => {
    openLegalHash(id, 'replace')
  }, [])

  const scrollToHeading = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
    setActiveHeading(id)
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="legal-dialog"
      aria-labelledby="legal-dialog-title"
      onClose={onDialogClose}
      onClick={onBackdropClick}
    >
      {docId ? (
        <div className="legal-sheet" onClick={(e) => e.stopPropagation()}>
          <header className="legal-header">
            <div className="legal-header__main">
              <nav className="legal-tabs" aria-label={t('legal.docsNav')}>
                <button
                  type="button"
                  className={
                    docId === 'terms'
                      ? 'legal-tabs__btn is-active'
                      : 'legal-tabs__btn'
                  }
                  onClick={() => switchDoc('terms')}
                >
                  {t('legal.terms')}
                </button>
                <button
                  type="button"
                  className={
                    docId === 'privacy'
                      ? 'legal-tabs__btn is-active'
                      : 'legal-tabs__btn'
                  }
                  onClick={() => switchDoc('privacy')}
                >
                  {t('legal.privacy')}
                </button>
              </nav>
              <div className="legal-header__actions">
                <LanguageSwitch />
                <button
                  type="button"
                  className="legal-close"
                  onClick={onClose}
                  aria-label={t('legal.close')}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </header>

          <div className="legal-scroll">
            {toc.length > 0 ? (
              <nav className="legal-toc" aria-label={t('legal.contents')}>
                <p className="legal-toc__label">{t('legal.contents')}</p>
                <ul>
                  {toc.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className={
                          activeHeading === h.id
                            ? 'legal-toc__btn is-active'
                            : 'legal-toc__btn'
                        }
                        onClick={() => scrollToHeading(h.id)}
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <article ref={articleRef} className="legal-article">
              {showLoading ? (
                <p className="legal-status">{t('legal.loading')}</p>
              ) : null}
              {docId && error ? (
                <p className="legal-status legal-status--error">{error}</p>
              ) : null}
              {showDoc && doc ? (
                <>
                  <h1 id="legal-dialog-title">{doc.title}</h1>
                  <p className="legal-updated">
                    {t('legal.updated')}: {formatUpdated(doc.updated, locale)}
                  </p>
                  <div className="legal-prose">
                    <MarkdownBody doc={doc} onLegalLink={switchDoc} />
                  </div>
                </>
              ) : null}
            </article>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}

function CloseIcon() {
  return (
    <svg className="legal-close__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
