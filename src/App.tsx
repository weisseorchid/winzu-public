import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from './components/LanguageSwitch/LanguageSwitch'
import { LighthouseAnimation } from './components/LighthouseAnimation/LighthouseAnimation'
import { LocaleDocument } from './i18n/LocaleDocument'

function App() {
  const { t } = useTranslation()

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
          <LanguageSwitch />
        </div>
      </header>

      <main className="main">
        <div className="shell main__inner">
          <div className="lighthouse">
            <LighthouseAnimation duration={14} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
