export type LegalHeading = {
  depth: 2 | 3
  text: string
  id: string
}

export type ParsedLegal = {
  title: string
  updated: string
  body: string
  headings: LegalHeading[]
}

function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stable heading ids shared by the TOC and react-markdown headings. */
export function slugHeading(
  text: string,
  used: Map<string, number> = new Map(),
): string {
  const base = slugify(text) || 'section'
  const count = used.get(base) ?? 0
  used.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

function extractHeadings(body: string): LegalHeading[] {
  const used = new Map<string, number>()
  const headings: LegalHeading[] = []
  for (const line of body.split(/\r?\n/)) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line)
    if (!match) continue
    const depth = match[1].length as 2 | 3
    const text = match[2].replace(/\s+#*$/, '').trim()
    if (!text) continue
    headings.push({ depth, text, id: slugHeading(text, used) })
  }
  return headings
}

export function parseLegal(raw: string): ParsedLegal {
  const trimmed = raw.replace(/^\uFEFF/, '')
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(trimmed)
  if (!match) {
    throw new Error('Legal markdown is missing YAML frontmatter')
  }

  let title = ''
  let updated = ''
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^(\w+)\s*:\s*(.*)$/.exec(line.trim())
    if (!kv) continue
    const value = kv[2].trim()
    if (kv[1] === 'title') title = value
    if (kv[1] === 'updated') updated = value
  }

  if (!title) throw new Error('Legal markdown is missing title')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
    throw new Error('Legal markdown is missing updated (YYYY-MM-DD)')
  }

  const body = match[2].replace(/^\r?\n/, '')
  return { title, updated, body, headings: extractHeadings(body) }
}
