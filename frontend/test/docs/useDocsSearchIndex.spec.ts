import { DocsSearchIndexEntry, DocsSearchResult } from 'types/docs'
import { describe, expect, test } from 'vitest'

import {
  buildIndex,
  buildSnippet,
  limitResults,
  normaliseSearchText,
  searchDocs,
  tokenise,
} from '../../src/docs/useDocsSearchIndex'

const entries: DocsSearchIndexEntry[] = [
  {
    slug: 'testing/secondary',
    title: 'Secondary guide',
    text: 'Install Bailo later.',
    headings: [],
  },
  {
    slug: 'testing/primary',
    title: 'Install Bailo',
    text: 'Use <unsafe> & "quoted" values when installing Bailo.',
    headings: [
      {
        depth: 2,
        text: 'Linux installation',
        id: 'linux-installation',
        body: 'Install Bailo on Linux.',
      },
      {
        depth: 3,
        text: 'Package setup',
        id: 'package-setup',
        body: 'Install Bailo packages.',
      },
      {
        depth: 3,
        text: 'Container setup',
        id: 'container-setup',
        body: 'Install Bailo containers.',
      },
      {
        depth: 3,
        text: 'Source setup',
        id: 'source-setup',
        body: 'Install Bailo from source.',
      },
    ],
  },
]

describe('documentation runtime search', () => {
  test('normalises and tokenises Unicode queries consistently', () => {
    expect(normaliseSearchText('ＣAFÉ')).toBe('café')
    expect(tokenise('  Install   BAILO ')).toEqual({
      phrase: 'install   bailo',
      isPhrase: true,
      tokens: ['install', 'bailo'],
    })
    expect(tokenise('a valid')).toEqual({
      phrase: 'a valid',
      isPhrase: true,
      tokens: ['valid'],
    })
  })

  test('orders stronger page matches first and limits headings per page', () => {
    const results = searchDocs(buildIndex(entries), 'install bailo')

    expect(results[0]).toMatchObject({
      kind: 'page',
      slug: 'testing/primary',
      title: 'Install Bailo',
    })
    expect(results.filter((result) => result.slug === 'testing/primary' && result.kind === 'heading')).toHaveLength(3)
    expect(results.find((result) => result.hash === 'linux-installation')?.href).toBe(
      '/docs/testing/primary#linux-installation',
    )
  })

  test('escapes snippets before adding mark elements', () => {
    const snippet = buildSnippet('<script>alert("x")</script> & install', tokenise('install'))

    const ampersand = String.fromCharCode(38)
    expect(snippet).toContain(
      `${ampersand}lt;script${ampersand}gt;alert(${ampersand}quot;x${ampersand}quot;)` +
        `${ampersand}lt;/script${ampersand}gt; ${ampersand}amp;`,
    )
    expect(snippet).toContain('<mark>install</mark>')
    expect(snippet).not.toContain('<script>')
  })

  test('applies category limits while preserving category order', () => {
    const categories = ['models', 'docs', 'datacards'] as const
    const results: DocsSearchResult[] = categories.flatMap((category) =>
      Array.from({ length: 25 }, (_, index) => ({
        key: `${category}:${index}`,
        slug: `${index}`,
        category,
        title: `${category} ${index}`,
        breadcrumb: '',
        score: 25 - index,
        kind: 'page',
        href: `/${category}/${index}`,
      })),
    )

    const limited = limitResults(results, 'all')

    expect(limited).toHaveLength(60)
    expect(limited.slice(0, 20).every((result) => result.category === 'docs')).toBe(true)
    expect(limited.slice(20, 40).every((result) => result.category === 'datacards')).toBe(true)
    expect(limited.slice(40).every((result) => result.category === 'models')).toBe(true)
    expect(limitResults(results, 'docs')).toHaveLength(50)
  })
})
