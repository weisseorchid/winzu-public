import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CookieBanner } from './components/CookieBanner/CookieBanner'
import { LanguageSwitch } from './components/LanguageSwitch/LanguageSwitch'
import { LighthouseAnimation } from './components/LighthouseAnimation/LighthouseAnimation'
import {
  applyConsentPreferences,
  denyAllOptionalConsent,
  getConsentPreferences,
  grantAllOptionalConsent,
  hasAnsweredConsent,
  registerBuiltInProviders,
  setConsentPreferences,
  type ConsentPreferences,
} from './consent'
import { LocaleDocument } from './i18n/LocaleDocument'
import { LegalDialog } from './legal/LegalDialog'
import { openLegal } from './legal/legalHash'

registerBuiltInProviders()

function App() {
  const { t } = useTranslation()
  const [prefs, setPrefs] = useState<ConsentPreferences | null>(() =>
    getConsentPreferences(),
  )
  const [cookiePrefsOpen, setCookiePrefsOpen] = useState(false)

  useEffect(() => {
    applyConsentPreferences(prefs)
  }, [prefs])

  const showCookieBanner = !hasAnsweredConsent(prefs) || cookiePrefsOpen

  function handleAccept() {
    const next = grantAllOptionalConsent()
    setConsentPreferences(next)
    setPrefs(next)
    setCookiePrefsOpen(false)
  }

  function handleReject() {
    const next = denyAllOptionalConsent()
    setConsentPreferences(next)
    setPrefs(next)
    setCookiePrefsOpen(false)
  }

  return (
    <div className="app">
      <LocaleDocument />
      <header className="header">
        <div className="shell header__inner">
          <div className="winzu-logo">
            <img
              className="winzu-logo__mark"
              src="/icons/winzu_logo.svg"
              alt=""
              width={26}
              height={44}
            />
            <h1 className="winzu-logo__title">
              <span className="winzu-logo__name">winzu</span>
              <span className="winzu-logo__tag">{t('brand.tag')}</span>
            </h1>
          </div>
          <div className="header__actions">
            <LanguageSwitch />
          </div>
        </div>
      </header>

      <main className="main">
        <div className="shell main__inner">
          <div className="lighthouse">
            <LighthouseAnimation duration={14} />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <nav className="site-footer__nav" aria-label={t('legal.docsNav')}>
            <button
              type="button"
              className="ghost-link"
              onClick={() => openLegal('privacy')}
            >
              {t('legal.privacy')}
            </button>
            <button
              type="button"
              className="ghost-link"
              onClick={() => openLegal('terms')}
            >
              {t('legal.terms')}
            </button>
            <button
              type="button"
              className="ghost-link"
              onClick={() => setCookiePrefsOpen(true)}
            >
              {t('cookies.open')}
            </button>
          </nav>
        </div>
      </footer>

      <CookieBanner
        open={showCookieBanner}
        onAccept={handleAccept}
        onReject={handleReject}
      />
      <LegalDialog />
    </div>
  )
}

export default App
