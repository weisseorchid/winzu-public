import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { openLegal } from '../../legal/legalHash'
import './CookieBanner.css'

type CookieBannerProps = {
  open: boolean
  onAccept: () => void
  onReject: () => void
}

export function CookieBanner({ open, onAccept, onReject }: CookieBannerProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const bodyId = useId()

  if (!open) return null

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <div className="shell cookie-banner__inner">
        <div className="cookie-banner__copy">
          <p className="cookie-banner__title" id={titleId}>
            {t('cookies.title')}
          </p>
          <p className="cookie-banner__body" id={bodyId}>
            {t('cookies.body')}{' '}
            <button
              type="button"
              className="cookie-banner__privacy"
              onClick={() => openLegal('privacy')}
            >
              {t('cookies.privacyLink')}
            </button>
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--reject"
            onClick={onReject}
          >
            {t('cookies.reject')}
          </button>
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--accept"
            onClick={onAccept}
          >
            {t('cookies.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
