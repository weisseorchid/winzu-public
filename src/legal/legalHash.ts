import { isLegalId, type LegalId } from '../content/legal/loadLegal'

export function hashLegalId(): LegalId | null {
  const raw = window.location.hash.replace(/^#/, '')
  return isLegalId(raw) ? raw : null
}

export function openLegalHash(id: LegalId, mode: 'push' | 'replace') {
  const url = `${window.location.pathname}${window.location.search}#${id}`
  if (mode === 'push') {
    window.history.pushState(null, '', url)
  } else {
    window.history.replaceState(null, '', url)
  }
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function closeLegalHash() {
  const url = `${window.location.pathname}${window.location.search}`
  window.history.pushState(null, '', url)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function openLegal(id: LegalId = 'terms') {
  openLegalHash(id, hashLegalId() ? 'replace' : 'push')
}
