import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatPaperDate } from '../papers/formatDate'
import { listPapers } from '../papers/loadPapers'

export function PapersPage() {
  const { t, i18n } = useTranslation()
  const papers = listPapers()

  return (
    <main className="main">
      <div className="shell">
        <div className="page">
          <h1 className="page__title">{t('papers.title')}</h1>
          <p className="page__lead">{t('papers.lead')}</p>
          {papers.length === 0 ? (
            <p className="page__empty">{t('papers.empty')}</p>
          ) : (
            <ul className="paper-list">
              {papers.map((paper) => (
                <li key={paper.slug} className="paper-list__item">
                  <Link
                    to={`/papers/${paper.slug}`}
                    className="paper-list__link"
                  >
                    <h2 className="paper-list__title">{paper.title}</h2>
                    <p className="paper-list__meta">
                      {formatPaperDate(
                        paper.publishedAt,
                        i18n.resolvedLanguage ?? 'en',
                      )}
                    </p>
                    <p className="paper-list__abstract">{paper.abstract}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
