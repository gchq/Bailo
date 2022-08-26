import { readdirSync, readFileSync, statSync } from 'fs'
import matter from 'gray-matter'
import { nanoid } from 'nanoid'
import { DocFileOrHeading, DocsMenuContent } from '../../types/interfaces'

type DocsFrontMatter = {
  priority?: number
}

const sortByPriority = (a: DocFileOrHeading, b: DocFileOrHeading): number => {
  // As the highest priority is 1, we don't care about 0
  if (a.priority && b.priority) return a.priority - b.priority
  if (!a.priority && b.priority) return 1
  if (a.priority && !b.priority) return -1
  return 0
}

const convertFileOrDirNameToTitle = (str: string): string =>
  str
    .split('-')
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ')

const removeFileExtension = (fileOrDirName: string): string => {
  const extensionIndex = fileOrDirName.indexOf('.')
  return extensionIndex === -1 ? fileOrDirName : fileOrDirName.slice(0, extensionIndex)
}

const updateHeadingPriority = (
  headingPriority: number | undefined,
  childPriority: number | undefined
): number | undefined => {
  if (childPriority && childPriority > 0 && (!headingPriority || childPriority < headingPriority)) {
    return childPriority
  }
  return headingPriority
}

const extractFrontMatterFromFile = (fileOrDirPath: string): DocsFrontMatter => {
  const fileContents = readFileSync(fileOrDirPath).toString()
  return matter(fileContents).data
}

const extractFrontMatterFromDir = (
  dirPath: string,
  partialSlug = ''
): [DocsMenuContent, boolean, number | undefined] => {
  let headingHasIndex = false
  let headingPriority: number | undefined
  const docsDirectoryContents = readdirSync(dirPath)

  const docsMenuContent: DocsMenuContent = docsDirectoryContents
    .reduce<DocsMenuContent>((docsMetadata, fileOrDirName) => {
      const nameWithoutExtension = removeFileExtension(fileOrDirName)
      const title = convertFileOrDirNameToTitle(nameWithoutExtension)
      const currentSlug = partialSlug ? `${partialSlug}/${nameWithoutExtension}` : nameWithoutExtension
      const fileOrDirPath = `${dirPath}/${fileOrDirName}`
      const stats = statSync(fileOrDirPath)

      if (stats.isFile() && fileOrDirName.slice(-4) === '.mdx') {
        const frontMatter = extractFrontMatterFromFile(fileOrDirPath)
        headingPriority = updateHeadingPriority(headingPriority, frontMatter.priority)
        if (fileOrDirName === 'index.mdx') {
          headingHasIndex = true
        } else {
          docsMetadata.push({
            id: nanoid(),
            title,
            slug: currentSlug,
            ...(frontMatter.priority && frontMatter.priority > 0 && { priority: frontMatter.priority }),
          })
        }
      } else if (stats.isDirectory()) {
        const [headingChildren, hasIndex, highestChildPriority] = extractFrontMatterFromDir(fileOrDirPath, currentSlug)
        headingPriority = updateHeadingPriority(headingPriority, highestChildPriority)
        docsMetadata.push({
          id: nanoid(),
          title,
          slug: currentSlug,
          hasIndex,
          children: headingChildren,
          ...(highestChildPriority && { priority: highestChildPriority }),
        })
      }

      return docsMetadata
    }, [])
    .sort(sortByPriority)

  return [docsMenuContent, headingHasIndex, headingPriority]
}

const generateDocsMenuContent = (): DocsMenuContent => {
  const basePath = 'pages/docs'
  const [docsMenuContent] = extractFrontMatterFromDir(basePath)
  return docsMenuContent
}

export default generateDocsMenuContent
