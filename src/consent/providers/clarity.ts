import Clarity from '@microsoft/clarity'
import type { TrackingProvider } from '../types'

let started = false

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void
  }
}

function start(): void {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID
  if (!projectId) return

  if (!started) {
    Clarity.init(projectId)
    started = true
  }

  Clarity.consentV2({
    ad_Storage: 'denied',
    analytics_Storage: 'granted',
  })
}

function stop(): void {
  if (!started) return

  Clarity.consentV2({
    ad_Storage: 'denied',
    analytics_Storage: 'denied',
  })

  try {
    window.clarity?.('stop')
  } catch {
    // Clarity may not expose stop until the tag finishes loading
  }

  started = false
}

export const clarityProvider: TrackingProvider = {
  id: 'microsoft-clarity',
  category: 'analytics',
  start,
  stop,
}
