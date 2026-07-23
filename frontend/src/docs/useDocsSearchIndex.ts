import { useMemo } from 'react'

import { flatDirectory } from './directory'
import rawIndex from './searchIndex.generated.json'

/**
 * Raw heading shape produced by `scripts/build-docs-search-index.mjs`.
 */
export interface RawHeading {
  depth: number
  text: string
  id: string
  body: string
}

/**
 * Raw entry shape produced by `scripts/build-docs-search-index.mjs`.
 */
export interface RawIndexEntry {
  slug: string
  title: string
  text: string
  headings: RawHeading[]
}

/**
 * Result kind. `page` results link to the docs page; `heading` results link to a
 * heading anchor inside the page (e.g. `/docs/foo#bar`).
 */
export type DocsSearchResultKind = 'page' | 'heading'

/**
 * A single docs search result returned by `search`.
 */
export interface DocsSearchResult {
  /** Unique key suitable for React lists. */
  key: string
  /** Page slug (no leading slash, no `#`). */
  slug: string
  /** Heading anchor id (no leading `#`). Undefined for page-level results. */
  hash?: string
  /** Display title. For headings, this is the heading text. */
  title: string
  /** Section breadcrumb, e.g. "Users / Models" - or for headings, "Page title". */
  breadcrumb: string
  /** A short snippet of body text around the first match, with `<mark>` highlights. */
  snippetHtml: string
  /** Score used for ranking; higher = better. */
  score: number
  /** Result kind for UI affordances. */
  kind: DocsSearchResultKind
}

interface IndexedHeading extends RawHeading {
  textLower: string
  bodyLower: string
}

interface IndexedEntry {
  slug: string
  title: string
  titleLower: string
  text: string
  haystack: string
  headings: IndexedHeading[]
  /** Lowercased concatenation of every heading text, used as a quick page-level signal. */
  headingsLower: string
  breadcrumb: string
}

const MAX_RESULTS = 10
const MAX_HEADING_RESULTS_PER_PAGE = 3
const SNIPPET_RADIUS = 60
const MIN_TOKEN_LENGTH = 2

/**
 * Common English stop words that we don't want to score or highlight on their
 * own (they inflate scores and produce noisy `<mark>` spans on words like "a",
 * "is", "the", etc.). They *are* still allowed to participate in phrase matches.
 */
const STOP_WORDS = new Set<string>([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'if',
  'so',
  'of',
  'to',
  'in',
  'on',
  'for',
  'at',
  'by',
  'as',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'from',
  'with',
  'how',
  'what',
  'why',
  'when',
  'where',
  'which',
  'who',
  'whom',
  'can',
  'could',
  'do',
  'does',
  'did',
  'has',
  'have',
  'had',
  'not',
  'no',
  'yes',
  'you',
  'your',
  'we',
  'our',
  'i',
])

/**
 * Terms extracted from a user query, used for both scoring and highlighting.
 */
interface QueryTerms {
  /** Meaningful tokens (stop words removed, minimum length enforced). */
  tokens: string[]
  /** The trimmed, lowercased original query. Used for phrase matching. */
  phrase: string
  /** True when `phrase` contains more than one raw word. */
  isPhrase: boolean
}

/**
 * Build a section breadcrumb (e.g. "Users / Models") for a given slug by walking the
 * sidebar directory and collecting `header` entries that are ancestors of the slug.
 */
function buildBreadcrumb(slug: string): string {
  if (!slug) {
    return ''
  }
  const parts = slug.split('/')
  const ancestors: string[] = []
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join('/')
    const header = flatDirectory.find((entry) => entry.slug === prefix && entry.header)
    if (header) {
      ancestors.push(header.title)
    }
  }
  return ancestors.join(' / ')
}

/**
 * Resolve a friendly title for a slug. Prefers the title from `flatDirectory` (since
 * it's the curated, human-edited sidebar title) and falls back to the title parsed
 * out of the MDX file.
 */
function resolveTitle(slug: string, fallback: string): string {
  const entry = flatDirectory.find((e) => e.slug === slug && !e.header)
  if (entry) {
    return entry.title
  }
  return fallback
}

function buildIndex(): IndexedEntry[] {
  return (rawIndex as RawIndexEntry[]).map((entry) => {
    const title = resolveTitle(entry.slug, entry.title)
    const headings: IndexedHeading[] = entry.headings.map((h) => ({
      ...h,
      textLower: h.text.toLowerCase(),
      bodyLower: h.body.toLowerCase(),
    }))
    return {
      slug: entry.slug,
      title,
      titleLower: title.toLowerCase(),
      text: entry.text,
      haystack: entry.text.toLowerCase(),
      headings,
      headingsLower: headings.map((h) => h.textLower).join('\n'),
      breadcrumb: buildBreadcrumb(entry.slug),
    }
  })
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Wrap matches of the query phrase and/or individual tokens in `<mark>` tags.
 * The phrase is listed first in the alternation so wherever it occurs it gets
 * highlighted as a single contiguous span; adjacent `<mark>`s separated only by
 * whitespace are also merged so the visual highlight bar spans that whitespace.
 */
function highlight(source: string, terms: QueryTerms): string {
  const escaped = escapeHtml(source)
  const alternatives: string[] = []
  const seen = new Set<string>()
  if (terms.isPhrase && terms.phrase.length > 0) {
    alternatives.push(escapeRegExp(terms.phrase))
    seen.add(terms.phrase)
  }
  for (const token of terms.tokens) {
    if (seen.has(token)) {
      continue
    }
    alternatives.push(escapeRegExp(token))
    seen.add(token)
  }
  if (alternatives.length === 0) {
    return escaped
  }
  const pattern = new RegExp(`(${alternatives.join('|')})`, 'gi')
  const marked = escaped.replace(pattern, '<mark>$1</mark>')
  // Merge adjacent <mark>...</mark> spans separated only by whitespace so the
  // highlight visually flows across word boundaries.
  return marked.replace(/<\/mark>(\s+)<mark>/g, '$1')
}

/**
 * Build a short snippet of body text around the first match of the phrase (or,
 * failing that, any meaningful token). Includes up to `SNIPPET_RADIUS` characters
 * of context on each side, and highlights matches.
 */
function buildSnippet(text: string, terms: QueryTerms): string {
  if (!text) {
    return ''
  }
  const lowerText = text.toLowerCase()
  let firstHit = -1
  let hitLength = 0
  if (terms.isPhrase) {
    const i = lowerText.indexOf(terms.phrase)
    if (i !== -1) {
      firstHit = i
      hitLength = terms.phrase.length
    }
  }
  if (firstHit === -1) {
    for (const token of terms.tokens) {
      const i = lowerText.indexOf(token)
      if (i !== -1 && (firstHit === -1 || i < firstHit)) {
        firstHit = i
        hitLength = token.length
      }
    }
  }

  let start: number
  let end: number
  if (firstHit === -1) {
    start = 0
    end = Math.min(text.length, SNIPPET_RADIUS * 2)
  } else {
    start = Math.max(0, firstHit - SNIPPET_RADIUS)
    end = Math.min(text.length, firstHit + hitLength + SNIPPET_RADIUS)
  }

  while (start > 0 && /\w/.test(text[start - 1]) && /\w/.test(text[start])) {
    start--
  }
  while (end < text.length && /\w/.test(text[end - 1]) && /\w/.test(text[end])) {
    end++
  }

  const prefix = start > 0 ? '… ' : ''
  const suffix = end < text.length ? ' …' : ''
  return prefix + highlight(text.slice(start, end), terms) + suffix
}

function tokenise(query: string): QueryTerms {
  const phrase = query.trim().toLowerCase()
  const raw = phrase.split(/\s+/).filter((t) => t.length > 0)
  const tokens = raw.filter((t) => t.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(t))
  return {
    tokens,
    phrase,
    isPhrase: raw.length > 1,
  }
}

/** Number of times `needle` occurs in `haystack`, capped at 20 to keep scoring bounded. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) {
    return 0
  }
  let count = 0
  let i = 0
  while ((i = haystack.indexOf(needle, i)) !== -1 && count < 20) {
    count++
    i += needle.length
  }
  return count
}

function scorePage(entry: IndexedEntry, terms: QueryTerms): number {
  let score = 0
  // Phrase-level boosts: an exact phrase match should always outrank a bag of
  // scattered token hits.
  if (terms.isPhrase) {
    if (entry.titleLower.includes(terms.phrase)) {
      score += 40
    }
    if (entry.headingsLower.includes(terms.phrase)) {
      score += 20
    }
    if (entry.haystack.includes(terms.phrase)) {
      score += 10 + countOccurrences(entry.haystack, terms.phrase) * 5
    }
  }
  for (const token of terms.tokens) {
    let tokenScore = 0
    if (entry.titleLower.includes(token)) {
      tokenScore += 10
      if (new RegExp(`\\b${escapeRegExp(token)}\\b`).test(entry.titleLower)) {
        tokenScore += 10
      }
    }
    if (entry.headingsLower.includes(token)) {
      tokenScore += 5
    }
    if (entry.haystack.includes(token)) {
      tokenScore += countOccurrences(entry.haystack, token)
    }
    if (tokenScore === 0) {
      return 0
    }
    score += tokenScore
  }
  return score
}

function scoreHeading(heading: IndexedHeading, terms: QueryTerms): number {
  let score = 0
  if (terms.isPhrase) {
    if (heading.textLower.includes(terms.phrase)) {
      score += 40
    }
    if (heading.bodyLower.includes(terms.phrase)) {
      score += 10 + countOccurrences(heading.bodyLower, terms.phrase) * 5
    }
  }
  for (const token of terms.tokens) {
    let tokenScore = 0
    if (heading.textLower.includes(token)) {
      tokenScore += 15
      if (new RegExp(`\\b${escapeRegExp(token)}\\b`).test(heading.textLower)) {
        tokenScore += 10
      }
    }
    if (heading.bodyLower.includes(token)) {
      tokenScore += countOccurrences(heading.bodyLower, token)
    }
    if (tokenScore === 0) {
      return 0
    }
    score += tokenScore
  }
  // Slight depth bias: prefer shallower headings (h2 > h3 > h4).
  return score + Math.max(0, 4 - heading.depth)
}

/**
 * Hook returning a stable `search(query)` function plus the index size.
 *
 * The index is built once per mount from the precomputed JSON, so calling
 * `search` repeatedly is cheap.
 */
export function useDocsSearchIndex(): {
  search: (query: string) => DocsSearchResult[]
  size: number
} {
  const index = useMemo(() => buildIndex(), [])

  const search = useMemo(() => {
    return (query: string): DocsSearchResult[] => {
      const terms = tokenise(query)
      if (terms.tokens.length === 0 && terms.phrase.length === 0) {
        return []
      }

      const results: DocsSearchResult[] = []

      for (const entry of index) {
        // Page-level match.
        const pageScore = scorePage(entry, terms)
        if (pageScore > 0) {
          results.push({
            key: entry.slug || '__root__',
            slug: entry.slug,
            title: entry.title,
            breadcrumb: entry.breadcrumb,
            snippetHtml: buildSnippet(entry.text, terms),
            score: pageScore,
            kind: 'page',
          })
        }

        // Heading-level matches. Take the top N per page so a single page can't flood
        // the result list.
        const headingHits: DocsSearchResult[] = []
        for (const heading of entry.headings) {
          const hScore = scoreHeading(heading, terms)
          if (hScore <= 0) {
            continue
          }
          headingHits.push({
            key: `${entry.slug}#${heading.id}`,
            slug: entry.slug,
            hash: heading.id,
            title: heading.text,
            breadcrumb: entry.title + (entry.breadcrumb ? ` — ${entry.breadcrumb}` : ''),
            snippetHtml: buildSnippet(heading.body || entry.text, terms),
            score: hScore,
            kind: 'heading',
          })
        }
        headingHits.sort((a, b) => b.score - a.score)
        results.push(...headingHits.slice(0, MAX_HEADING_RESULTS_PER_PAGE))
      }

      results.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }
        // Pages above headings at equal score.
        if (a.kind !== b.kind) {
          return a.kind === 'page' ? -1 : 1
        }
        return a.title.localeCompare(b.title)
      })

      return results.slice(0, MAX_RESULTS)
    }
  }, [index])

  return { search, size: index.length }
}
