import bundleAnalyzer from '@next/bundle-analyzer'
import nextMDX from '@next/mdx'
import removeImports from 'next-remove-imports'
import path from 'path'
import rehypeHighlight from 'rehype-highlight'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { fileURLToPath } from 'url'

const withRemoveImports = removeImports()

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

const isDevelopment = process.env.NODE_ENV === 'development'
const backend = process.env.BACKEND_SERVICE ?? 'http://backend:3001'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@bailo/shared', 'nanoid', 'lodash-es', '@uiw/react-textarea-code-editor'],

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
    ]
  },

  compiler: {
    emotion: true,
  },
  swcMinify: true,

  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  eslint: {
    dirs: ['__tests__', 'data', 'lib', 'pages', 'server', 'src', 'types', 'utils'],
  },

  experimental: {
    swcTraceProfiling: true,
    outputFileTracingRoot: path.join(fileURLToPath(new URL('.', import.meta.url)), '../../'),
  },
}

export default withRemoveImports(withBundleAnalyzer(withMDX(nextConfig)))
