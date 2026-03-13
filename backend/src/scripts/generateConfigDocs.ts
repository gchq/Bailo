import { mkdirSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

import markdownConfig from '../../src/utils/markdown.js'

function script() {
  const outDir = resolve(process.cwd(), 'dist')
  mkdirSync(outDir, { recursive: true })

  writeFileSync(join(outDir, 'config-docs.json'), JSON.stringify({ config: markdownConfig }, null, 2), 'utf-8')
}

script()
