import { marked } from 'marked'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatPaperDate } from '../papers/formatDate'
import { getPaper } from '../papers/loadPapers'

export function PaperPage() {
  const { slug = '' } = useParams()
  const { t, i18n } = useTranslation()
  const paper = getPaper(slug)

  if (!paper) {
    return (
      <main className="main">
        <div className="shell">
          <div className="page">
            <Link to="/papers" className="paper__back">
              {t('papers.back')}
            </Link>
            <h1 className="page__title">{t('papers.notFoundTitle')}</h1>
            <p className="page__empty">{t('papers.notFoundBody')}</p>
          </div>
        </div>
      </main>
    )
  }

  const html = marked.parse(paper.body, { async: false }) as string

  return (
    <main className="main">
      <div className="shell">
        <article className="paper">
          <Link to="/papers" className="paper__back">
            {t('papers.back')}
          </Link>
          <h1 className="paper__title">{paper.title}</h1>
          <p className="paper__meta">
            {formatPaperDate(paper.publishedAt, i18n.resolvedLanguage ?? 'en')}
          </p>
          <p className="paper__abstract">{paper.abstract}</p>
          <div
            className="paper__body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>
    </main>
  )
}
