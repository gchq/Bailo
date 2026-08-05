import { EntrySearchResult, useListEntries } from 'actions/entry'
import { useMemo } from 'react'
import useDebounce from 'src/hooks/useDebounce'
import {
  DocsSearchCategory as SearchCategory,
  DocsSearchFilter as SearchFilter,
  DocsSearchHookResult,
  DocsSearchIndexEntry,
  DocsSearchQueryTerms as QueryTerms,
  DocsSearchResult,
  EntrySearchDocument,
  IndexedDocsSearchEntry as IndexedEntry,
  IndexedDocsSearchHeading as IndexedHeading,
} from 'types/docs'
import { EntryKindKeys } from 'types/types'

import { flatDirectory } from './directory'
import rawIndex from './searchIndex.generated.json'

export type { DocsSearchResult, SearchFilter }

const EMPTY_FILTER: never[] = []

const MAX_RESULTS = 50
const MAX_RESULTS_PER_CATEGORY = 20
const MAX_HEADING_RESULTS_PER_PAGE = 3
const MIN_BACKEND_QUERY_LENGTH = 1
const SEARCH_DEBOUNCE_MS = 250
const SNIPPET_RADIUS = 60
const MIN_TOKEN_LENGTH = 2

const CATEGORY_ORDER: SearchCategory[] = ['docs', 'datacards', 'models']

const ENTRY_CATEGORIES: Partial<Record<EntryKindKeys, 'models' | 'datacards'>> = {
  model: 'models',
  'data-card': 'datacards',
  'mirrored-model': 'models',
  'untrusted-model': 'models',
}

const START_SCREEN: DocsSearchResult[] = [
  {
    breadcrumb: 'Getting Started',
    category: 'docs',
    href: '/docs/getting-started/quick-start',
    key: 'docs:getting-started/quick-start',
    kind: 'page',
    score: 0,
    slug: 'getting-started/quick-start',
    snippetHtml: 'Create your first model in ~15 minutes',
    title: 'New to Bailo?',
  },
  {
    breadcrumb: 'Core Concepts',
    category: 'docs',
    href: '/docs/getting-started/core-concepts',
    key: 'docs:getting-started/core-concepts',
    kind: 'page',
    score: 0,
    slug: 'getting-started/core-concepts',
    snippetHtml: 'You want to understand more about the lifecycle of a model',
    title: 'What is Bailo?',
  },
  {
    breadcrumb: 'Reference',
    category: 'docs',
    href: '/docs/reference/troubleshooting',
    key: 'docs:reference/troubleshooting',
    kind: 'page',
    score: 0,
    slug: 'reference/troubleshooting',
    snippetHtml: "You've got a problem with Bailo and are not sure where to start",
    title: 'Troubleshooting & FAQ',
  },
]

function buildBreadcrumb(slug: string): string {
  if (!slug) {
    return ''
  }

  const parts = slug.split('/')
  const ancestors: string[] = []

  for (let index = 1; index < parts.length; index += 1) {
    const prefix = parts.slice(0, index).join('/')
    const header = flatDirectory.find((entry) => entry.slug === prefix && entry.header)

    if (header) {
      ancestors.push(header.title)
    }
  }

  return ancestors.join(' / ')
}

function resolveTitle(slug: string, fallback: string): string {
  return flatDirectory.find((entry) => entry.slug === slug && !entry.header)?.title ?? fallback
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize#nfkc
export function normaliseSearchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase()
}

export function buildIndex(entries: DocsSearchIndexEntry[] = rawIndex as DocsSearchIndexEntry[]): IndexedEntry[] {
  return entries.map((entry) => {
    const title = resolveTitle(entry.slug, entry.title)

    const headings = entry.headings.map((heading): IndexedHeading => ({
      ...heading,
      textLower: normaliseSearchText(heading.text),
      bodyLower: normaliseSearchText(heading.body),
    }))

    return {
      slug: entry.slug,
      title,
      titleLower: normaliseSearchText(title),
      text: entry.text,
      haystack: normaliseSearchText(entry.text),
      headings,
      headingsLower: headings.map((heading) => heading.textLower).join('\n'),
      breadcrumb: buildBreadcrumb(entry.slug),
    }
  })
}

function normaliseEntries(entries: EntrySearchResult[]): EntrySearchDocument[] {
  return entries.flatMap((entry) => {
    const category = ENTRY_CATEGORIES[entry.kind]

    if (!category) {
      return []
    }

    const basePath = category === 'models' ? '/model' : '/data-card'

    return [
      {
        key: `${category}:${entry.id}`,
        slug: entry.id,
        category,
        title: entry.name,
        breadcrumb: entry.description,
        text: [entry.name, entry.description, entry.organisation, ...entry.tags].filter(Boolean).join(' '),
        href: `${basePath}/${encodeURIComponent(entry.id)}`,
      },
    ]
  })
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function tokenise(query: string): QueryTerms {
  const phrase = normaliseSearchText(query.trim())
  const rawTokens = phrase.split(/\s+/).filter(Boolean)

  return {
    phrase,
    isPhrase: rawTokens.length > 1,
    tokens: rawTokens.filter((token) => token.length >= MIN_TOKEN_LENGTH),
  }
}

function highlight(source: string, terms: QueryTerms): string {
  const escapedSource = escapeHtml(source)
  const alternatives: string[] = []
  const seen = new Set<string>()

  if (terms.isPhrase && terms.phrase) {
    alternatives.push(escapeRegExp(terms.phrase))
    seen.add(terms.phrase)
  }

  for (const token of terms.tokens) {
    if (!seen.has(token)) {
      alternatives.push(escapeRegExp(token))
      seen.add(token)
    }
  }

  if (alternatives.length === 0) {
    return escapedSource
  }

  const pattern = new RegExp(`(${alternatives.join('|')})`, 'gi')

  return escapedSource.replace(pattern, '<mark>$1</mark>').replace(/<\/mark>(\s+)<mark>/g, '$1')
}

export function buildSnippet(text: string, terms: QueryTerms): string {
  if (!text) {
    return ''
  }

  const lowerText = normaliseSearchText(text)
  const candidates = [...(terms.isPhrase ? [terms.phrase] : []), ...terms.tokens]

  let firstHit = -1
  let hitLength = 0

  for (const candidate of candidates) {
    const index = lowerText.indexOf(candidate)

    if (index !== -1 && (firstHit === -1 || index < firstHit)) {
      firstHit = index
      hitLength = candidate.length
    }
  }

  let start = firstHit === -1 ? 0 : Math.max(0, firstHit - SNIPPET_RADIUS)

  let end =
    firstHit === -1
      ? Math.min(text.length, SNIPPET_RADIUS * 2)
      : Math.min(text.length, firstHit + hitLength + SNIPPET_RADIUS)

  while (start > 0 && /\w/.test(text[start - 1]) && /\w/.test(text[start])) {
    start -= 1
  }

  while (end < text.length && /\w/.test(text[end - 1]) && /\w/.test(text[end])) {
    end += 1
  }

  const prefix = start > 0 ? '… ' : ''
  const suffix = end < text.length ? ' …' : ''

  return `${prefix}${highlight(text.slice(start, end), terms)}${suffix}`
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) {
    return 0
  }

  let count = 0
  let index = 0

  while ((index = haystack.indexOf(needle, index)) !== -1 && count < 20) {
    count += 1
    index += needle.length
  }

  return count
}

function containsWholeWord(haystack: string, token: string): boolean {
  return new RegExp(`\\b${escapeRegExp(token)}\\b`).test(haystack)
}

function scorePage(entry: IndexedEntry, terms: QueryTerms): number {
  let score = 0

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

      if (containsWholeWord(entry.titleLower, token)) {
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

      if (containsWholeWord(heading.textLower, token)) {
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

  return score + Math.max(0, 4 - heading.depth)
}

function scoreEntry(entry: EntrySearchDocument, terms: QueryTerms): number {
  const title = normaliseSearchText(entry.title)
  const breadcrumb = normaliseSearchText(entry.breadcrumb)
  const text = normaliseSearchText(entry.text)

  let score = 0

  if (terms.phrase) {
    if (title === terms.phrase) {
      score += 100
    } else if (title.startsWith(terms.phrase)) {
      score += 75
    } else if (title.includes(terms.phrase)) {
      score += 50
    }

    if (breadcrumb.includes(terms.phrase)) {
      score += 20
    }

    if (text.includes(terms.phrase)) {
      score += 10
    }
  }

  for (const token of terms.tokens) {
    if (title === token) {
      score += 40
    } else if (title.startsWith(token)) {
      score += 30
    } else if (title.includes(token)) {
      score += 20
    }

    if (breadcrumb.includes(token)) {
      score += 8
    }

    if (text.includes(token)) {
      score += 4
    }
  }

  return score
}

function compareResults(left: DocsSearchResult, right: DocsSearchResult): number {
  if (left.score !== right.score) {
    return right.score - left.score
  }

  if (left.kind !== right.kind) {
    return left.kind === 'page' ? -1 : 1
  }

  return left.title.localeCompare(right.title)
}

function toEntryResult(entry: EntrySearchDocument, terms?: QueryTerms): DocsSearchResult {
  return {
    key: entry.key,
    slug: entry.slug,
    category: entry.category,
    title: entry.title,
    breadcrumb: entry.breadcrumb,
    snippetHtml: terms ? buildSnippet(entry.text, terms) : undefined,
    score: terms ? Math.max(scoreEntry(entry, terms), 1) : 0,
    kind: 'page',
    href: entry.href,
  }
}

export function searchDocs(index: IndexedEntry[], query: string): DocsSearchResult[] {
  if (!query) {
    return [...START_SCREEN]
  }

  const terms = tokenise(query)
  const results: DocsSearchResult[] = []

  for (const entry of index) {
    const pageScore = scorePage(entry, terms)

    if (pageScore > 0) {
      results.push({
        key: `docs:${entry.slug || '__root__'}`,
        slug: entry.slug,
        category: 'docs',
        title: entry.title,
        breadcrumb: entry.breadcrumb,
        snippetHtml: buildSnippet(entry.text, terms),
        score: pageScore,
        kind: 'page',
        href: `/docs/${entry.slug}`,
      })
    }

    const headingResults = entry.headings
      .map((heading): DocsSearchResult | undefined => {
        const score = scoreHeading(heading, terms)

        if (score <= 0) {
          return undefined
        }

        return {
          key: `docs:${entry.slug}#${heading.id}`,
          slug: entry.slug,
          category: 'docs',
          hash: heading.id,
          title: heading.text,
          breadcrumb: [entry.title, entry.breadcrumb].filter(Boolean).join(' - '),
          snippetHtml: buildSnippet(heading.body || entry.text, terms),
          score,
          kind: 'heading',
          href: `/docs/${entry.slug}#${heading.id}`,
        }
      })
      .filter((result): result is DocsSearchResult => result !== undefined)
      .sort(compareResults)
      .slice(0, MAX_HEADING_RESULTS_PER_PAGE)

    results.push(...headingResults)
  }

  return results.sort(compareResults)
}

export function searchEntries(
  entries: EntrySearchDocument[],
  query: string,
  category: SearchFilter,
): DocsSearchResult[] {
  const matchingCategory = entries.filter((entry) => category === 'all' || entry.category === category)

  if (!query) {
    return matchingCategory
      .map((entry) => toEntryResult(entry))
      .sort((left, right) => left.title.localeCompare(right.title))
  }

  if (query.length < MIN_BACKEND_QUERY_LENGTH) {
    return []
  }

  const terms = tokenise(query)

  return matchingCategory.map((entry) => toEntryResult(entry, terms)).sort(compareResults)
}

export function limitResults(results: DocsSearchResult[], category: SearchFilter): DocsSearchResult[] {
  if (category !== 'all') {
    return results.slice(0, MAX_RESULTS)
  }

  return CATEGORY_ORDER.flatMap((resultCategory) =>
    results.filter((result) => result.category === resultCategory).slice(0, MAX_RESULTS_PER_CATEGORY),
  )
}

export function useDocsSearchIndex(
  query: string,
  isOpen: boolean = false,
  selectedCategory: SearchFilter = 'all',
): DocsSearchHookResult {
  const docsIndex = useMemo(() => buildIndex(), [])

  const trimmedQuery = query.trim()
  const debouncedQuery = useDebounce(trimmedQuery, SEARCH_DEBOUNCE_MS)

  const includesDocs = selectedCategory === 'all' || selectedCategory === 'docs'

  const includesEntries =
    selectedCategory === 'all' || selectedCategory === 'models' || selectedCategory === 'datacards'

  const backendQuery = debouncedQuery.length >= MIN_BACKEND_QUERY_LENGTH ? debouncedQuery : ''

  const {
    entries = [],
    isEntriesLoading,
    isEntriesError,
  } = useListEntries(
    undefined,
    EMPTY_FILTER,
    '',
    EMPTY_FILTER,
    EMPTY_FILTER,
    EMPTY_FILTER,
    EMPTY_FILTER,
    backendQuery,
    false,
    '',
    includesEntries && isOpen,
  )

  const entryIndex = useMemo(() => normaliseEntries(entries), [entries])

  const docsResults = useMemo(
    () => (includesDocs ? searchDocs(docsIndex, trimmedQuery) : []),
    [includesDocs, trimmedQuery, docsIndex],
  )

  const isDebouncing =
    includesEntries && trimmedQuery.length >= MIN_BACKEND_QUERY_LENGTH && trimmedQuery !== debouncedQuery

  const entryResults = useMemo(() => {
    if (!includesEntries || isDebouncing) {
      return []
    }

    return searchEntries(entryIndex, debouncedQuery, selectedCategory)
  }, [debouncedQuery, entryIndex, includesEntries, isDebouncing, selectedCategory])

  const results = useMemo(() => {
    const combined = [...docsResults, ...entryResults]

    if (trimmedQuery) {
      combined.sort(compareResults)
    }

    return limitResults(combined, selectedCategory)
  }, [docsResults, entryResults, selectedCategory, trimmedQuery])

  return {
    results,
    size: docsIndex.length + entryIndex.length,
    isLoading: includesEntries && (isEntriesLoading || isDebouncing),
    isError: isEntriesError,
  }
}
