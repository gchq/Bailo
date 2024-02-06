const { rm, cp } = require('shelljs')
const { readFileSync, writeFileSync, readdirSync } = require('fs')
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

  content = content.replaceAll(
    `import Image from 'next/legacy/image'`,
    dedent(`
      import Image from 'next/legacy/image'
      import imageLoader from 'src/imageLoader'
    `),
  )

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

  rm('-rf', 'pages/docs')
  rm('-rf', 'public')

  cp('-R', '../../frontend/public', './')
  cp('-R', '../../frontend/pages/docs', './pages/')
  cp('-R', '../../frontend/src/docs', './src/')
  cp('../../frontend/src/Copyright.tsx', './src/')
  cp('../../frontend/src/Link.tsx', './src/')

  for (let file of getFiles(join(process.cwd(), './pages/docs'))) {
    if (file.endsWith('.mdx')) {
      alterFile(file)
    } else {
      rm(file)
    }
  }

  cp('../../frontend/pages/docs/directory.tsx', './pages/docs')

  // Python Sphinx Documentation
  cp('-R', '../python-beta/docs/_build/dirhtml', 'public/docs/python')
}

run()
