import bundleAnalyzer from '@next/bundle-analyzer'
import nextMDX from '@next/mdx'
import isDocker from 'is-docker'
import removeImports from 'next-remove-imports'
import rehypeHighlight from 'rehype-highlight'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

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

const defaultBackend = isDocker() ? 'http://backend:3001' : 'http://localhost:3001'
const backend = process.env.BACKEND_SERVICE ?? defaultBackend

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['nanoid', 'lodash-es', '@uiw/react-textarea-code-editor'],

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
}

export default withRemoveImports(withBundleAnalyzer(withMDX(nextConfig)))
