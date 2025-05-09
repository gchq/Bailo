/** @type {import('next').NextConfig} */
import nextMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.mjs
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: [remarkFrontmatter, remarkGfm],
    rehypePlugins: [rehypeHighlight],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
})

export default withMDX({
  // Append the default value with md extensions
  output: 'export',
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    loader: 'custom',
  },
  basePath: process.env.BASE_PATH,
})
