const { rm, cp, mkdir } = require('shelljs')
const { readFileSync, writeFileSync, readdirSync } = require('fs')
const { resolve, join } = require('path')
const dedent = require('dedent-js')

function alterFile(path) {
  let content = readFileSync(path, { encoding: 'utf-8' })

  content = content.replaceAll(
    `import DocsWrapper from '@/src/docs/DocsWrapper'`,
    dedent(`
      import DocsWrapper from '@/components/DocsWrapper'
      import generateDocsMenuContent from '@/components/getSidebarContent'`)
  )

  content = content.replaceAll(
    `export default ({ children }) => <DocsWrapper>{children}</DocsWrapper>`,
    dedent(`
      export default ({ children, menu }) => <DocsWrapper menu={menu}>{children}</DocsWrapper>
      export async function getStaticProps() {
        return { props: { menu: await generateDocsMenuContent() } }
      }
    `)
  )

  content = content.replaceAll(`<Image`, `<Image loader={imageLoader}`)

  content = content.replaceAll(
    `import Image from 'next/image'`,
    dedent(`
      import Image from 'next/legacy/image'
      import imageLoader from '@/components/imageLoader'
    `)
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
  rm('-rf', 'src')

  cp('-R', '../../public', './')
  cp('-R', '../../pages/docs', './pages/')
  mkdir('src')
  cp('-R', '../../src/docs', './src/')

  for (let file of getFiles(join(process.cwd(), './pages/docs'))) {
    if (file.endsWith('.mdx')) {
      alterFile(file)
    } else {
      rm(file)
    }
  }

  rm('./pages/docs/developers/project-layout.mdx')
}

run()
