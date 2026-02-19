const { rm, cp } = require('shelljs')
const { readFileSync, writeFileSync, readdirSync, mkdirSync } = require('fs')
const { resolve, join } = require('path')
const dedent = require('dedent-js')

function alterFile(path) {
  let content = readFileSync(path, { encoding: 'utf-8' })

  content = content.replaceAll(
    `import DocsWrapper from 'src/docs/DocsWrapper'`,
    dedent(`
      import DocsWrapper from 'src/docs/DocsWrapper'
      import { directory } from 'pages/docs/directory'`),
  )

  content = content.replaceAll(
    `import DocsWrapper from '../../src/docs/DocsWrapper'`,
    dedent(`
      import DocsWrapper from 'src/docs/DocsWrapper'
      import { directory } from 'pages/docs/directory'`),
  )

  content = content.replaceAll(
    `export default ({ children }) => <DocsWrapper>{children}</DocsWrapper>`,
    dedent(`
      export default ({ children, menu }) => <DocsWrapper menu={menu}>{children}</DocsWrapper>
      export async function getStaticProps() {
        return { props: { menu: directory } }
      }
    `),
  )

  content = content.replaceAll(`<Image`, `<Image loader={imageLoader}`)
  content = content.replaceAll(`<Container`, `<Container sx={{ mt: 4 }}`)

  content = content.replaceAll(
    `import Image from 'next/legacy/image'`,
    dedent(`
      import Image from 'next/legacy/image'
      import imageLoader from 'src/imageLoader'
    `),
  )

  content = content.replaceAll(`import Config from './Config'`, `import Config from './Config.static'`)

  writeFileSync(path, content)
}

function getFiles(dir) {
  let files = []

  const dirents = readdirSync(dir, { withFileTypes: true })
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      files = files.concat(getFiles(res))
    } else {
      files.push(res)
    }
  }

  return files
}

async function run() {
  console.log(process.cwd())
  const EXTRA_ALLOWED_FILES = new Set([
    resolve(process.cwd(), 'pages/docs/administration/getting-started/Config.static.tsx'),
  ])

  rm('-Rf', './src/common')
  mkdirSync('./src/common', function (err) {
    if (err) {
      console.log(err)
    }
  })

  rm('-Rf', 'pages/docs')
  rm('-Rf', 'public')

  cp('-R', '../../frontend/public', './')
  cp('-R', '../../frontend/pages/docs', './pages/')
  cp('-R', '../../frontend/pages/accessibility', './pages/')
  cp('-R', '../../frontend/src/docs', './src/')
  cp('../../frontend/src/Copyright.tsx', './src/')
  cp('../../frontend/src/Link.tsx', './src/')
  cp('-Rf', '../../frontend/src/common/Title.tsx', './src/common/')

  for (let file of [
    ...getFiles(join(process.cwd(), './pages/docs')),
    ...getFiles(join(process.cwd(), './pages/accessibility')),
  ]) {
    if (file.endsWith('.mdx')) {
      alterFile(file)
    } else if (EXTRA_ALLOWED_FILES.has(file)) {
      // noop: keep file as is
    } else {
      rm(file)
    }
  }

  cp('../../frontend/pages/docs/directory.tsx', './pages/docs')

  // Python Sphinx Documentation
  cp('-R', '../../backend/docs/python-docs/html', './public/docs/python')

  // Backend static config JSON
  mkdirSync('./public/config')
  cp('../../backend/dist/config-docs.json', './public/config/config-docs.json')
}

run()
