import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const MIN_INDEXED_HEADING_DEPTH = 2
const MAX_INDEXED_HEADING_DEPTH = 3

/**
 * @typedef {import('../types/docs.ts').DocumentationNavigationEntry} DocumentationNavigationEntry
 * @typedef {import('../types/docs.ts').DocsSearchIndexEntry} DocsSearchIndexEntry
 * @typedef {import('../types/docs.ts').DocsSearchIndexHeading} DocsSearchIndexHeading
 */

/**
 * Return whether a resolved path escapes its expected root.
 *
 * @param {string} root
 * @param {string} path
 */
function isOutsideRoot(root, path) {
  const relativePath = relative(root, path)

  return relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)
}

/**
 * Resolve a navigation slug to either `<slug>.mdx` or `<slug>/index.mdx`.
 *
 * @param {string} docsRoot
 * @param {string} slug
 */
export function findMdxFile(docsRoot, slug) {
  const candidates = [resolve(docsRoot, `${slug}.mdx`), resolve(docsRoot, slug, 'index.mdx')]

  for (const file of candidates) {
    if (isOutsideRoot(docsRoot, file)) {
      throw new Error(`Invalid documentation slug: "${slug}"`)
    }

    if (statSync(file, { throwIfNoEntry: false })?.isFile()) {
      return file
    }
  }

  return undefined
}

/**
 * Convert an AST node to searchable plain text without indexing executable MDX,
 * code blocks, HTML markup, or import/export declarations.
 *
 * @param {Record<string, any>} node
 * @returns {string}
 */
function textFromNode(node) {
  if (
    node.type === 'code' ||
    node.type === 'html' ||
    node.type === 'mdxjsEsm' ||
    node.type === 'mdxFlowExpression' ||
    node.type === 'mdxTextExpression'
  ) {
    return ''
  }

  if (node.type === 'text' || node.type === 'inlineCode') {
    return node.value
  }

  if (node.type === 'image') {
    return node.alt ?? ''
  }

  if (!Array.isArray(node.children)) {
    return ''
  }

  return node.children.map(textFromNode).filter(Boolean).join(' ')
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Extract page text and H2/H3 search sections from an MDX document.
 *
 * All heading titles contribute to page text. Section prose contributes to
 * every active H2/H3 ancestor so parent sections match descendant content.
 *
 * @param {string} raw
 * @param {string} [sourcePath]
 * @returns {{ headings: DocsSearchIndexHeading[], text: string }}
 */
export function extractContent(raw, sourcePath = '<MDX source>') {
  let tree

  try {
    tree = unified().use(remarkParse).use(remarkMdx).parse({ value: raw, path: sourcePath })
  } catch (error) {
    const line = error?.line ?? error?.place?.start?.line
    const location = line ? `${sourcePath}:${line}` : sourcePath
    throw new Error(`Unable to parse documentation at ${location}: ${error.message}`, { cause: error })
  }

  const slugger = new GithubSlugger()
  /** @type {DocsSearchIndexHeading[]} */
  const headings = []
  /** @type {Array<DocsSearchIndexHeading & { bodyParts: string[] }>} */
  const activeHeadings = []
  const pageParts = []

  for (const node of tree.children) {
    if (node.type === 'heading') {
      const headingText = cleanText(toString(node))

      if (!headingText) {
        const line = node.position?.start.line
        throw new Error(`Empty heading in ${sourcePath}${line ? `:${line}` : ''}`)
      }

      pageParts.push(headingText)
      const id = slugger.slug(headingText)

      while (activeHeadings.at(-1)?.depth >= node.depth) {
        activeHeadings.pop()
      }

      if (node.depth >= MIN_INDEXED_HEADING_DEPTH && node.depth <= MAX_INDEXED_HEADING_DEPTH) {
        const heading = {
          depth: /** @type {2 | 3} */ (node.depth),
          text: headingText,
          id,
          body: '',
          bodyParts: [],
        }

        headings.push(heading)
        activeHeadings.push(heading)
      }

      continue
    }

    const text = cleanText(textFromNode(node))

    if (!text) {
      continue
    }

    pageParts.push(text)

    for (const heading of activeHeadings) {
      heading.bodyParts.push(text)
    }
  }

  return {
    headings: headings.map(({ bodyParts, ...heading }) => ({
      ...heading,
      body: cleanText(bodyParts.join(' ')),
    })),
    text: cleanText(pageParts.join(' ')),
  }
}

/**
 * Build and validate the generated index from navigation data.
 *
 * @param {{ docsRoot: string, navigation: DocumentationNavigationEntry[] }} options
 * @returns {DocsSearchIndexEntry[]}
 */
export function buildSearchIndex({ docsRoot, navigation }) {
  if (!statSync(docsRoot, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Documentation directory not found at ${docsRoot}`)
  }

  const pageEntries = navigation.filter((entry) => !entry.header)
  const seenSlugs = new Set()
  const seenFiles = new Map()

  return pageEntries.map(({ title, slug }) => {
    if (!title.trim()) {
      throw new Error(`Documentation entry with slug "${slug}" has an empty title`)
    }

    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate documentation slug: "${slug}"`)
    }

    seenSlugs.add(slug)

    const file = findMdxFile(docsRoot, slug)

    if (!file) {
      throw new Error(`No MDX file found for documentation entry "${title}" with slug "${slug}"`)
    }

    const canonicalFile = realpathSync(file)
    const existingSlug = seenFiles.get(canonicalFile)

    if (existingSlug) {
      throw new Error(`Documentation slugs "${existingSlug}" and "${slug}" resolve to the same file: ${file}`)
    }

    seenFiles.set(canonicalFile, slug)

    const { headings, text } = extractContent(readFileSync(file, 'utf8'), file)

    return { slug, title, text, headings }
  })
}

/**
 * Write the generated index schema as formatted JSON.
 *
 * @param {DocsSearchIndexEntry[]} entries
 * @param {string} output
 */
export function writeSearchIndex(entries, output) {
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(entries, null, 2)}\n`, 'utf8')
}
