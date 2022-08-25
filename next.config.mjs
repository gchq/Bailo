import nextBundleAnalyzer from '@next/bundle-analyzer'
import nextMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkFrontmatter],
    rehypePlugins: [],
  },
})

export default withBundleAnalyzer(
  withMDX({
    swcMinify: true,
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  })
)
