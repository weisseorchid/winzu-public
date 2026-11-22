import type { ConsentCategory, ConsentChoice, ConsentPreferences } from './types'

const STORAGE_KEY = 'winzu.cookieConsent'
const CATEGORIES = ['analytics'] as const satisfies readonly ConsentCategory[]

function isChoice(value: unknown): value is ConsentChoice {
  return value === 'granted' || value === 'denied'
}

function normalizePreferences(raw: unknown): ConsentPreferences | null {
  if (raw == null) return null

  // Legacy flat value from the first Clarity-only consent.
  if (isChoice(raw)) {
    return { analytics: raw }
  }

  if (typeof raw !== 'object') return null

  const prefs: ConsentPreferences = {}
  let hasAny = false

  for (const category of CATEGORIES) {
    const choice = (raw as Record<string, unknown>)[category]
    if (isChoice(choice)) {
      prefs[category] = choice
      hasAny = true
    }
  }

  return hasAny ? prefs : null
}

export function getConsentPreferences(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return null

    try {
      return normalizePreferences(JSON.parse(raw))
    } catch {
      return normalizePreferences(raw)
    }
  } catch {
    return null
  }
}

export function setConsentPreferences(prefs: ConsentPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode / blocked storage
  }
}

/** True when every optional category has a saved choice. */
export function hasAnsweredConsent(
  prefs: ConsentPreferences | null = getConsentPreferences(),
): boolean {
  if (!prefs) return false
  return CATEGORIES.every((category) => isChoice(prefs[category]))
}

export function grantAllOptionalConsent(): ConsentPreferences {
  const prefs: ConsentPreferences = {}
  for (const category of CATEGORIES) {
    prefs[category] = 'granted'
  }
  return prefs
}

export function denyAllOptionalConsent(): ConsentPreferences {
  const prefs: ConsentPreferences = {}
  for (const category of CATEGORIES) {
    prefs[category] = 'denied'
  }
  return prefs
}
