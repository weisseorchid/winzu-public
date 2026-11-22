export type {
  ConsentCategory,
  ConsentChoice,
  ConsentPreferences,
  TrackingProvider,
} from './types'
export {
  denyAllOptionalConsent,
  getConsentPreferences,
  grantAllOptionalConsent,
  hasAnsweredConsent,
  setConsentPreferences,
} from './storage'
export {
  applyConsentPreferences,
  listTrackingProviders,
  registerTrackingProvider,
} from './registry'
export { registerBuiltInProviders } from './providers'
