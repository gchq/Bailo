import bundleAnalyzer from '@next/bundle-analyzer'
import nextMDX from '@next/mdx'
import isDocker from 'is-docker'
import rehypeHighlight from 'rehype-highlight'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkFrontmatter, remarkGfm],
    rehypePlugins: [rehypeHighlight],
  },
})

const defaultBackend = isDocker() ? 'http://backend:3001' : 'http://localhost:3001'
const backend = process.env.BACKEND_SERVICE ?? defaultBackend

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['nanoid', 'lodash-es'],

  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      {
        source: '/docs/python/:path*',
        destination: `${backend}/docs/python/:path*`,
      },
    ]
  },

  pageExtensions: ['tsx', 'mdx'],
}

export default withBundleAnalyzer(withMDX(nextConfig))
