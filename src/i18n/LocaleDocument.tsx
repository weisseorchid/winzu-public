import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function LocaleDocument() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const sync = () => {
      document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
      document.title = i18n.t('meta.title')
    }

    sync()
    i18n.on('languageChanged', sync)
    return () => {
      i18n.off('languageChanged', sync)
    }
  }, [i18n])

  return null
}
