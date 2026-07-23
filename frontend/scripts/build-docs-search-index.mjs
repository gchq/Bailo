import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flatDirectory } from '../src/docs/directory.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = resolve(__dirname, '..')
const DOCS_ROOT = resolve(FRONTEND_ROOT, 'pages/docs')
const OUTPUT = resolve(FRONTEND_ROOT, 'src/docs/searchIndex.generated.json')

/** Maximum heading depth that produces a separate search entry. */
const MAX_INDEXED_HEADING_DEPTH = 3

/**
 * Convert a directory slug into the corresponding MDX file.
 *
 * Examples:
 *   ''                    -> pages/docs/index.mdx
 *   'foo/bar'             -> pages/docs/foo/bar.mdx
 *   'foo/bar'             -> pages/docs/foo/bar/index.mdx
 */
function findMdxFile(slug) {
  const candidates = [resolve(DOCS_ROOT, `${slug}.mdx`), resolve(DOCS_ROOT, slug, 'index.mdx')]

  for (const file of candidates) {
    // Prevent accidental paths escaping pages/docs.
    const relativePath = relative(DOCS_ROOT, file)

    if (relativePath.startsWith('..') || relativePath.includes(`..`)) {
      throw new Error(`Invalid documentation slug: ${slug}`)
    }

    if (statSync(file, { throwIfNoEntry: false })?.isFile()) {
      return file
    }
  }

  return undefined
}

function baseSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\t\n]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}\-_]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

class Slugger {
  seen = new Map()

  slug(text) {
    const base = baseSlug(text) || 'section'
    const count = this.seen.get(base) ?? 0

    this.seen.set(base, count + 1)

    return count === 0 ? base : `${base}-${count}`
  }
}

/**
 * Strip inline Markdown/MDX syntax.
 */
function stripInline(s) {
  return s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_)/g, '')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract headings and page text from an MDX document.
 */
function extractContent(raw) {
  const lines = raw.split(/\r?\n/)
  const slugger = new Slugger()
  const headings = []

  const allBodyLines = []
  let currentHeading
  let inFence = false

  const finishHeading = () => {
    if (!currentHeading) {
      return
    }

    headings.push({
      depth: currentHeading.depth,
      text: currentHeading.text,
      id: currentHeading.id,
      body: currentHeading.bodyLines.join(' ').replace(/\s+/g, ' ').trim(),
    })

    currentHeading = undefined
  }

  for (let line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }

    if (inFence) {
      continue
    }

    // Skip MDX imports and exports.
    if (/^\s*(import|export)\s/.test(line)) {
      continue
    }

    // Skip standalone JSX lines.
    if (/^\s*<[A-Za-z/]/.test(line.trim())) {
      continue
    }

    const headingMatch = line.match(/^\s{0,3}(#{1,4})\s+(.+?)\s*#*\s*$/)

    if (headingMatch) {
      finishHeading()

      const depth = headingMatch[1].length
      const text = stripInline(headingMatch[2])
      const id = slugger.slug(text)

      currentHeading = {
        depth,
        text,
        id,
        bodyLines: [],
      }

      continue
    }

    // Remove blockquote markers.
    line = line.replace(/^\s{0,3}>\s?/g, '')

    const cleaned = stripInline(line)

    if (cleaned) {
      allBodyLines.push(cleaned)

      if (currentHeading) {
        currentHeading.bodyLines.push(cleaned)
      }
    }
  }

  finishHeading()

  return {
    headings,
    text: allBodyLines.join(' ').replace(/\s+/g, ' ').trim(),
  }
}

function main() {
  if (!statSync(DOCS_ROOT, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`[build-docs-search-index] docs directory not found at ${DOCS_ROOT}`)
    process.exit(1)
  }

  const entries = []

  for (const directoryEntry of flatDirectory) {
    const { title, slug, header } = directoryEntry

    // Remove header folders
    if (header) {
      continue
    }

    const file = findMdxFile(slug)

    if (!file) {
      throw new Error(`No MDX file found for directory entry ` + `"${title}" with slug "${slug}"`)
    }

    const raw = readFileSync(file, 'utf8')
    const { headings, text } = extractContent(raw)

    const filteredHeadings = headings.filter((heading) => heading.depth <= MAX_INDEXED_HEADING_DEPTH)

    entries.push({
      slug,
      title,
      text,
      headings: filteredHeadings,
    })
  }

  mkdirSync(dirname(OUTPUT), { recursive: true })

  writeFileSync(OUTPUT, JSON.stringify(entries, null, 2) + '\n', 'utf8')

  const headingCount = entries.reduce((count, entry) => count + entry.headings.length, 0)

  console.log(
    `Documentation indexer wrote ${entries.length} pages and ` +
      `${headingCount} headings to ${relative(FRONTEND_ROOT, OUTPUT)}`,
  )
}

main()
