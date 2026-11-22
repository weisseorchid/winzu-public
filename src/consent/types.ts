/** Optional cookie categories that require user consent. */
export type ConsentCategory = 'analytics'

export type ConsentChoice = 'granted' | 'denied'

/** Saved choices per category. Missing categories are treated as undecided. */
export type ConsentPreferences = Partial<
  Record<ConsentCategory, ConsentChoice>
>

/**
 * A third-party (or first-party) tracker gated by a consent category.
 * Add a new provider file, implement start/stop, and register it once.
 */
export type TrackingProvider = {
  id: string
  category: ConsentCategory
  start: () => void
  stop: () => void
}
