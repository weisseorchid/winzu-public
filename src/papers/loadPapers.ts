import type { Paper } from './types'

const modules = import.meta.glob('../content/papers/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function parseFrontmatter(raw: string): {
  data: Record<string, string>
  body: string
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { data: {}, body: raw.trim() }
  }

  const data: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    if (key) data[key] = value
  }

  return { data, body: match[2].trim() }
}

function slugFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/, '')
}

function toPaper(path: string, raw: string): Paper | null {
  const { data, body } = parseFrontmatter(raw)
  const title = data.title?.trim()
  const publishedAt = data.publishedAt?.trim()
  const abstract = data.abstract?.trim()

  if (!title || !publishedAt || !abstract) return null

  return {
    slug: slugFromPath(path),
    title,
    publishedAt,
    abstract,
    body,
  }
}

const papers = Object.entries(modules)
  .map(([path, raw]) => toPaper(path, raw))
  .filter((paper): paper is Paper => paper !== null)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export function listPapers(): Paper[] {
  return papers
}

export function getPaper(slug: string): Paper | undefined {
  return papers.find((paper) => paper.slug === slug)
}
