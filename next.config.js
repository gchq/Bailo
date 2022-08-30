const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  swcMinify: true,
  eslint: {
    dirs: ['__tests__', 'data', 'lib', 'pages', 'src', 'types', 'utils'],
  },
})
