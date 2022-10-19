import { join } from 'path'
import getAppRoot from 'app-root-path'
import { extractFrontMatterFromDir } from '../services/docs'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import { DocFileOrHeading, DocHeading, DocsMenuContent } from '../../types/interfaces'
import { consoleLog } from '../../utils/logging'

function isDocHeading(item: DocFileOrHeading): item is DocHeading {
  return 'children' in item
}

function terminalPrintMenuContent(tree: DocsMenuContent, depth = 0) {
  const pad = '  '.repeat(depth)

  for (const content of tree) {
    if (isDocHeading(content)) {
      // it's a folder
      if (content.hasIndex) {
        consoleLog(`${pad}${content.slug}/ (${content.priority})`)
      } else {
        consoleLog(`${pad}${content.slug}/`)
      }

      terminalPrintMenuContent(content.children, depth + 1)
    } else {
      // it's a single item
      consoleLog(`${pad}${content.slug} (${content.priority})`)
    }
  }
}

async function main() {
  await connectToMongoose()

  const appRoot = getAppRoot.toString()
  const docsPath = join(appRoot, 'pages', 'docs')

  const { docsMenuContent } = await extractFrontMatterFromDir(docsPath)
  terminalPrintMenuContent(docsMenuContent)

  setTimeout(disconnectFromMongoose, 50)
}

main()
