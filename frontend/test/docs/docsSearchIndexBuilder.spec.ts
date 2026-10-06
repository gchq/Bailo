import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import GithubSlugger from 'github-slugger'
import { afterEach, describe, expect, test } from 'vitest'

import { buildSearchIndex, extractContent, findMdxFile, writeSearchIndex } from '../../scripts/docs-search-index.mjs'

describe('documentation search-index builder', () => {
  const temporaryDirectories: string[] = []

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  function createDocsRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'bailo-docs-search-'))
    temporaryDirectories.push(root)
    return root
  }

  test('extracts AST content, github-slugger IDs, and hierarchical section bodies', () => {
    const source = `
import {
  ignored
} from './ignored'

export const hidden =
  'not searchable'

Page title
==========

## [Install](https://example.com) with \`Bailo\` - café 🚀

Parent introduction with & an entity.

### Linux: \`setup\`

Linux instructions.

#### Advanced options

Advanced details.

### Linux: \`setup\`

Second Linux instructions.

~~~js
const tildeSecret = true
~~~

\`\`\`\`md
\`\`\`
const backtickSecret = true
\`\`\`
\`\`\`\`

<Card
  kind='example'
>
  Searchable JSX text
</Card>

{hiddenExpression}
`

    const result = extractContent(source, 'example.mdx')
    const slugger = new GithubSlugger()

    expect(result.headings).toEqual([
      {
        depth: 2,
        text: 'Install with Bailo - café 🚀',
        id: slugger.slug('Install with Bailo - café 🚀'),
        body:
          'Parent introduction with & an entity. Linux instructions. Advanced details. ' +
          'Second Linux instructions. Searchable JSX text',
      },
      {
        depth: 3,
        text: 'Linux: setup',
        id: slugger.slug('Linux: setup'),
        body: 'Linux instructions. Advanced details.',
      },
      {
        depth: 3,
        text: 'Linux: setup',
        id: slugger.slug('Linux: setup'),
        body: 'Second Linux instructions. Searchable JSX text',
      },
    ])

    expect(result.text).not.toContain('Page title')
    expect(result.text).toContain('Advanced options')
    expect(result.text).toContain('Searchable JSX text')
    expect(result.text).not.toContain('tildeSecret')
    expect(result.text).not.toContain('backtickSecret')
    expect(result.text).not.toContain('hiddenExpression')
    expect(result.headings.every((heading) => heading.depth === 2 || heading.depth === 3)).toBe(true)
  })

  test('supports both MDX layouts and writes generated JSON', () => {
    const docsRoot = createDocsRoot()
    mkdirSync(join(docsRoot, 'guide', 'nested'), { recursive: true })
    writeFileSync(join(docsRoot, 'guide', 'page.mdx'), '# Page\n\n## First\n\nBody')
    writeFileSync(join(docsRoot, 'guide', 'nested', 'index.mdx'), '# Nested\n\n## Second\n\nMore body')

    const entries = buildSearchIndex({
      docsRoot,
      navigation: [
        { title: 'Guide', slug: 'guide', header: true },
        { title: 'Page', slug: 'guide/page' },
        { title: 'Nested', slug: 'guide/nested' },
      ],
    })

    const output = join(docsRoot, 'generated', 'index.json')
    writeSearchIndex(entries, output)

    expect(entries.map((entry) => entry.slug)).toEqual(['guide/page', 'guide/nested'])
    expect(JSON.parse(readFileSync(output, 'utf8'))).toEqual(entries)
  })

  test('accepts valid names containing two dots and rejects parent traversal', () => {
    const docsRoot = createDocsRoot()
    writeFileSync(join(docsRoot, 'version..history.mdx'), '# History')

    expect(findMdxFile(docsRoot, 'version..history')).toBe(join(docsRoot, 'version..history.mdx'))
    expect(() => findMdxFile(docsRoot, '../outside')).toThrow('Invalid documentation slug')
  })

  test('reports missing files and invalid navigation entries', () => {
    const docsRoot = createDocsRoot()

    expect(() =>
      buildSearchIndex({
        docsRoot,
        navigation: [{ title: 'Missing page', slug: 'missing' }],
      }),
    ).toThrow('No MDX file found')

    expect(() =>
      buildSearchIndex({
        docsRoot,
        navigation: [{ title: '', slug: 'empty-title' }],
      }),
    ).toThrow('empty title')
  })

  test('rejects duplicate page slugs', () => {
    const docsRoot = createDocsRoot()
    writeFileSync(join(docsRoot, 'duplicate.mdx'), '# Duplicate')

    expect(() =>
      buildSearchIndex({
        docsRoot,
        navigation: [
          { title: 'First', slug: 'duplicate' },
          { title: 'Second', slug: 'duplicate' },
        ],
      }),
    ).toThrow('Duplicate documentation slug')
  })
})
