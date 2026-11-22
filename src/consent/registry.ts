import type { ConsentPreferences, TrackingProvider } from './types'

const providers: TrackingProvider[] = []

export function registerTrackingProvider(provider: TrackingProvider): void {
  if (providers.some((entry) => entry.id === provider.id)) return
  providers.push(provider)
}

export function listTrackingProviders(): readonly TrackingProvider[] {
  return providers
}

/**
 * Starts or stops each registered provider based on its category choice.
 * Undecided / missing categories keep providers stopped.
 */
export function applyConsentPreferences(
  prefs: ConsentPreferences | null,
): void {
  for (const provider of providers) {
    if (prefs?.[provider.category] === 'granted') {
      provider.start()
    } else {
      provider.stop()
    }
  }
}
