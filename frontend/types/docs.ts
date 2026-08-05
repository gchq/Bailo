import type { ErrorInfo } from 'utils/fetcher'

export interface DocumentationNavigationEntry {
  title: string
  slug: string
  header?: boolean
  level?: number
}

export interface DocumentationNavigationTree {
  slug: string
  title: string
  header?: boolean
  level: number
  children?: DocumentationNavigationTree[]
}

/**
 * Schema emitted by the documentation search-index builder.
 *
 * Heading entries are limited to H2 and H3, while page text includes content
 * from headings of every depth.
 */
export interface DocsSearchIndexHeading {
  depth: 2 | 3
  text: string
  id: string
  body: string
}

export interface DocsSearchIndexEntry {
  slug: string
  title: string
  text: string
  headings: DocsSearchIndexHeading[]
}

export interface IndexedDocsSearchHeading extends DocsSearchIndexHeading {
  textLower: string
  bodyLower: string
}

export interface IndexedDocsSearchEntry {
  slug: string
  title: string
  titleLower: string
  text: string
  haystack: string
  headings: IndexedDocsSearchHeading[]
  headingsLower: string
  breadcrumb: string
}

export interface DocsSearchQueryTerms {
  tokens: string[]
  phrase: string
  isPhrase: boolean
}

export type DocsSearchResultKind = 'page' | 'heading'
export type DocsSearchCategory = 'docs' | 'datacards' | 'models'
export type EntrySearchCategory = Exclude<DocsSearchCategory, 'docs'>
export type DocsSearchFilter = DocsSearchCategory | 'all'

export interface DocsSearchCategoryOption {
  value: DocsSearchFilter
  label: string
}

export interface DocsSearchDialogProps {
  open: boolean
  onClose: () => void
}

export interface EntrySearchDocument {
  key: string
  slug: string
  category: EntrySearchCategory
  title: string
  breadcrumb: string
  text: string
  href: string
}

export interface DocsSearchResult {
  key: string
  slug: string
  category: DocsSearchCategory
  title: string
  breadcrumb: string
  snippetHtml?: string
  score: number
  kind: DocsSearchResultKind
  hash?: string
  href: string
}

export interface DocsSearchPageRow {
  kind: 'page'
  key: string
  category: DocsSearchCategory
  slug: string
  title: string
  breadcrumb: string
  result?: DocsSearchResult
}

export interface DocsSearchHeadingRow {
  kind: 'heading'
  key: string
  category: 'docs'
  result: DocsSearchResult
}

export type DocsSearchDisplayRow = DocsSearchPageRow | DocsSearchHeadingRow

export interface DocsSearchResultSection {
  category: DocsSearchCategory
  title: string
  rows: DocsSearchDisplayRow[]
}

export interface DocsSearchHookResult {
  results: DocsSearchResult[]
  size: number
  isLoading: boolean
  isError: ErrorInfo | undefined
}
