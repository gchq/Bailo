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
    fileScanners: {
      kinds: [],
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
  instrumentation: {
    enabled: false,
  },
  ui: {
    inference: {
      enabled: true,
    },
  },
}

export default config
