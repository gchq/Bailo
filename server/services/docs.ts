import { readdirSync, readFileSync, statSync } from 'fs'
import matter from 'gray-matter'
import { nanoid } from 'nanoid'
import { DocFileOrHeading, DocsMenuContent } from '../../types/interfaces'

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

const extractFrontMatterFromDir = (dirPath: string, partialSlug = ''): [DocsMenuContent, number | undefined] => {
  let headingPriority: number | undefined
  const docsDirectoryContents = readdirSync(dirPath)

  const updatedDocsMenuContent: DocsMenuContent = docsDirectoryContents
    .reduce<DocsMenuContent>((docsMetadata, fileOrDirName) => {
      const nameWithoutExtension = removeFileExtension(fileOrDirName)
      const title = convertFileOrDirNameToTitle(nameWithoutExtension)
      const currentSlug = partialSlug ? `${partialSlug}/${nameWithoutExtension}` : nameWithoutExtension
      const fileOrDirPath = `${dirPath}/${fileOrDirName}`
      const stats = statSync(fileOrDirPath)

      if (stats.isFile() && fileOrDirName.slice(-4) === '.mdx') {
        const fileContents = readFileSync(fileOrDirPath).toString()
        const frontMatter = matter(fileContents).data

        docsMetadata.push({
          id: nanoid(),
          title,
          slug: currentSlug,
          ...(frontMatter.priority && { priority: frontMatter.priority }), // As the highest priority is 1, we don't care about 0
        })
        if (
          frontMatter.priority &&
          frontMatter.priority > 0 &&
          (!headingPriority || frontMatter.priority < headingPriority)
        ) {
          headingPriority = frontMatter.priority
        }
      } else if (stats.isDirectory()) {
        const [headingChildren, highestChildPriority] = extractFrontMatterFromDir(fileOrDirPath, currentSlug)
        docsMetadata.push({
          id: nanoid(),
          title,
          children: headingChildren,
          ...(highestChildPriority && { priority: highestChildPriority }),
        })
      }

      return docsMetadata
    }, [])
    .sort(sortByPriority)

  return [updatedDocsMenuContent, headingPriority]
}

const generateDocsMenuContent = (): DocsMenuContent => {
  const basePath = 'pages/docs'
  const [docsMenuContent] = extractFrontMatterFromDir(basePath)
  return docsMenuContent
}

export default generateDocsMenuContent
