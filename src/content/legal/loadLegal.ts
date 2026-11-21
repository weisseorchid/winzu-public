import type { Locale } from '../../i18n'
import { parseLegal, type ParsedLegal } from './parseLegal'

export const LEGAL_IDS = ['terms', 'privacy'] as const
export type LegalId = (typeof LEGAL_IDS)[number]

const modules = import.meta.glob<string>('./*/*.md', {
  query: '?raw',
  import: 'default',
})

function moduleKey(locale: Locale, id: LegalId): string {
  return `./${locale}/${id}.md`
}

export function isLegalId(value: string): value is LegalId {
  return (LEGAL_IDS as readonly string[]).includes(value)
}

export function listLegalModules(): string[] {
  return Object.keys(modules).sort()
}

export async function loadLegal(
  locale: Locale,
  id: LegalId,
): Promise<ParsedLegal> {
  const preferred = modules[moduleKey(locale, id)]
  const fallback = modules[moduleKey('en', id)]
  const loader = preferred ?? fallback
  if (!loader) {
    throw new Error(`Missing legal document: ${id}`)
  }
  const raw = await loader()
  return parseLegal(raw)
}
