import { registerTrackingProvider } from '../registry'
import { clarityProvider } from './clarity'

let registered = false

/** Registers every built-in tracker once. Call before applying consent. */
export function registerBuiltInProviders(): void {
  if (registered) return
  registerTrackingProvider(clarityProvider)
  registered = true
}
