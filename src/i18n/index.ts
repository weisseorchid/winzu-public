import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { es } from './locales/es'

export const locales = [
  { code: 'en', label: 'ENG', nameKey: 'language.english' },
  { code: 'es', label: 'SPA', nameKey: 'language.spanish' },
] as const

export type Locale = (typeof locales)[number]['code']

const supportedLngs: Locale[] = locales.map((locale) => locale.code)

let starting: Promise<void> | null = null

export function initI18n(): Promise<void> {
  if (i18n.isInitialized) return Promise.resolve()
  if (starting) return starting

  starting = i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
      },
      fallbackLng: 'en',
      supportedLngs,
      load: 'languageOnly',
      returnNull: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'winzu.lang',
      },
      react: {
        useSuspense: false,
      },
    })
    .then(() => undefined)

  return starting
}
