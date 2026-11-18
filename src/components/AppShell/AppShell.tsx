import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../LanguageSwitch/LanguageSwitch'
import { LocaleDocument } from '../../i18n/LocaleDocument'
import './AppShell.css'

export function AppShell() {
  const { t } = useTranslation()

  return (
    <div className="app">
      <LocaleDocument />
      <header className="header">
        <div className="shell header__inner">
          <Link to="/" className="winzu-logo">
            <img
              className="winzu-logo__mark"
              src="/icons/winzu_logo.svg"
              alt=""
              width={26}
              height={44}
            />
            <span className="winzu-logo__title">
              <span className="winzu-logo__name">winzu</span>
              <span className="winzu-logo__tag">{t('brand.tag')}</span>
            </span>
          </Link>
          <div className="header__actions">
            <NavLink
              to="/papers"
              className="header__icon"
              aria-label={t('papers.nav')}
            >
              <PapersIcon />
            </NavLink>
            <LanguageSwitch />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

function PapersIcon() {
  return (
    <svg className="header__icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3.75h7.5L19 8.25v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 3.75V8.25H19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.5h6M9 16h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
