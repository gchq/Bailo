/** @type {import('next').NextConfig} */
import nextMDX from '@next/mdx'
const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.mjs
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: ['remark-frontmatter', 'remark-gfm'],
    rehypePlugins: ['rehype-highlight'],
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
  async exportPathMap(defaultPathMap) {
    delete defaultPathMap['/api-docs']
    delete defaultPathMap['/python-docs']
    return {
      ...defaultPathMap,
      '/api/docs': { page: '/api-docs' },
      '/docs/python': { page: '/python-docs' },
    }
  },
})
