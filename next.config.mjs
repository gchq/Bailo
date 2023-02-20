import nextBundleAnalyzer from '@next/bundle-analyzer'
import nextMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMermaid from 'mdx-mermaid'
import rehypeHighlight from 'rehype-highlight'
import removeImports from 'next-remove-imports'

const withRemoveImports = removeImports()

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMermaid],
    rehypePlugins: [rehypeHighlight],
  },
})

export default withRemoveImports(
  withBundleAnalyzer(
    withMDX({
      swcMinify: true,
      pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
      eslint: {
        dirs: ['__tests__', 'cypress', 'data', 'lib', 'pages', 'server', 'src', 'types', 'utils'],
      },
    })
  )
)
