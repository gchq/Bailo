import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { flatDirectory as documentationNavigation } from '../src/docs/directory.ts'
import { buildSearchIndex, writeSearchIndex } from './docs-search-index.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(scriptDirectory, '..')
const docsRoot = resolve(frontendRoot, 'pages/docs')
const output = resolve(frontendRoot, 'src/docs/searchIndex.generated.json')

export function main() {
  const entries = buildSearchIndex({
    docsRoot,
    navigation: documentationNavigation,
  })

  writeSearchIndex(entries, output)
}

const isCommandEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isCommandEntryPoint) {
  main()
}
