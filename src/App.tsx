import { Game } from './game/Game'
import { useI18n } from './i18n'

export default function App() {
  const { locale, t, setLocale } = useI18n()

  return (
    <div className="app-shell game-shell">
      <header className="topbar">
        <img
          className="wordmark"
          src={`${import.meta.env.BASE_URL}winzu-header-logo-white.svg`}
          alt={t.brand}
        />
        <div className="lang-toggle" role="group" aria-label="Language">
          <button
            type="button"
            className={locale === 'en' ? 'active' : undefined}
            onClick={() => setLocale('en')}
          >
            {t.langToggle.en}
          </button>
          <button
            type="button"
            className={locale === 'es' ? 'active' : undefined}
            onClick={() => setLocale('es')}
          >
            {t.langToggle.es}
          </button>
        </div>
      </header>
      <Game />
    </div>
  )
}
