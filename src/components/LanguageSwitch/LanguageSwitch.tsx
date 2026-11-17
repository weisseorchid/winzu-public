import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { locales, type Locale } from '../../i18n'
import './LanguageSwitch.css'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const active = (i18n.resolvedLanguage ?? 'en') as Locale
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return

    root.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (!root.contains(event.target)) setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
        return
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

      const items = [
        ...root.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'),
      ]
      const index = items.indexOf(document.activeElement as HTMLButtonElement)
      if (index === -1) return

      event.preventDefault()
      const next =
        event.key === 'ArrowDown'
          ? items[(index + 1) % items.length]
          : items[(index - 1 + items.length) % items.length]
      next?.focus()
    }

    const onFocusOut = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node)) {
        setOpen(false)
        return
      }
      if (!root.contains(event.relatedTarget)) setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    root.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('focusout', onFocusOut)
    }
  }, [open])

  return (
    <div className="lang" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="lang__trigger"
        aria-label={t('language.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <GlobeIcon />
      </button>
      {open ? (
        <div
          id={menuId}
          className="lang__menu"
          role="menu"
          aria-label={t('language.label')}
        >
          {locales.map((locale) => {
            const selected = active === locale.code
            return (
              <button
                key={locale.code}
                type="button"
                role="menuitemradio"
                className="lang__item"
                aria-checked={selected}
                lang={locale.code}
                onClick={() => {
                  void i18n.changeLanguage(locale.code)
                  setOpen(false)
                  buttonRef.current?.focus()
                }}
              >
                {t(locale.nameKey)}
                <span className="lang__mark" aria-hidden="true">
                  {selected ? <CheckIcon /> : null}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg className="lang__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="4"
        ry="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 12h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="lang__check" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
