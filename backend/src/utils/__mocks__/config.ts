const config = {
  app: {
    protocol: '',
    host: '',
    port: 3000,
  },
  s3: {
    buckets: {
      uploads: 'uploads',
      registry: 'registry',
    },
  },
  connectors: {
    authentication: {
      kind: 'silly',
    },
    audit: {
      kind: 'silly',
    },
    authorisation: {
      kind: 'basic',
    },
  },
  log: {
    level: 'debug',
  },
  registry: {
    connection: {
      internal: 'https://localhost:5000',
    },
  },
  oauth: {
    enabled: false,
  },
  experimental: {
    v2: true,
  },
}

export default config
