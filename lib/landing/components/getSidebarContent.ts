import { readdir, readFile, stat } from 'fs/promises'
import matter from 'gray-matter'
import { parse, join } from 'path'
import { DocFileOrHeading, DocHeading, DocsMenuContent } from '../types/interfaces'

type DocsFrontMatter = {
  priority?: number
}

const LOWEST_PRIORITY = Number.MAX_SAFE_INTEGER

const sortByPriority = (a: DocFileOrHeading, b: DocFileOrHeading): number => a.priority - b.priority

const convertFileOrDirNameToTitle = (str: string): string =>
  str
    .split('-')
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ')

const updateHeadingPriority = (headingPriority: number, childPriority: number): number => {
  if (childPriority && childPriority > 0 && (!headingPriority || childPriority < headingPriority)) {
    return childPriority
  }
  return headingPriority
}

const extractFrontMatterFromFile = async (fileOrDirPath: string): Promise<DocsFrontMatter> => {
  const fileContents = await readFile(fileOrDirPath, { encoding: 'utf8' })
  return matter(fileContents).data
}

export const extractFrontMatterFromDir = async (
  dirPath: string,
  partialSlug = ''
): Promise<{
  docsMenuContent: DocsMenuContent
  headingHasIndex: boolean
  highestChildPriority: number
}> => {
  let headingHasIndex = false
  let headingPriority = LOWEST_PRIORITY
  const docsDirectoryContents = await readdir(dirPath)

  const docsMenuContent: DocsMenuContent = await docsDirectoryContents.reduce<Promise<DocsMenuContent>>(
    async (docsMetadata, fileOrDirName) => {
      const metadata = await docsMetadata
      const { name } = parse(fileOrDirName)
      const title = convertFileOrDirNameToTitle(name)
      const currentSlug = partialSlug ? `${partialSlug}/${name}` : name
      const fileOrDirPath = `${dirPath}/${fileOrDirName}`
      const stats = await stat(fileOrDirPath)

      if (stats.isFile() && fileOrDirName.endsWith('.mdx')) {
        const frontMatter = await extractFrontMatterFromFile(fileOrDirPath)
        const filePriority = frontMatter.priority && frontMatter.priority > 0 ? frontMatter.priority : LOWEST_PRIORITY
        headingPriority = updateHeadingPriority(headingPriority, filePriority)
        if (fileOrDirName === 'index.mdx') {
          headingHasIndex = true
        } else {
          metadata.push({
            title,
            slug: currentSlug,
            priority: filePriority,
          })
        }
      } else if (stats.isDirectory()) {
        const {
          docsMenuContent: headingChildren,
          headingHasIndex: hasIndex,
          highestChildPriority,
        } = await extractFrontMatterFromDir(fileOrDirPath, currentSlug)
        headingPriority = updateHeadingPriority(headingPriority, highestChildPriority)
        metadata.push({
          title,
          slug: currentSlug,
          hasIndex,
          children: headingChildren,
          priority: highestChildPriority,
        })
      }

      return metadata
    },
    Promise.resolve([])
  )

  return {
    docsMenuContent: docsMenuContent.sort(sortByPriority),
    headingHasIndex,
    highestChildPriority: headingPriority,
  }
}

const generateDocsMenuContent = async (): Promise<DocsMenuContent> => {
  const basePath = join(process.cwd(), 'pages', 'docs')
  const { docsMenuContent } = await extractFrontMatterFromDir(basePath)

  const title: DocFileOrHeading = {
    title: 'Docs',
    slug: '',
    hasIndex: true,
    priority: -1,
    children: [],
  }

  return [title, ...docsMenuContent]
}

export default generateDocsMenuContent
