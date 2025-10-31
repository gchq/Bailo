/** @type {import('../src/utils/config.js').Config} */
module.exports = {
  build: {
    environment: 'img',
  },

  mongo: {
    uri: 'mongodb://mongo:27017/bailo',
  },

  app: {
    protocol: 'http',
    host: 'localhost',
    port: 8080,
    // Typically generated from `npm run certs`
    privateKey: '/certs/key.pem',
    publicKey: '/certs/cert.pem',
  },

  httpClient: {
    noProxy: ['localhost', '127.0.0.1', 'registry', 'minio'],
    defaultOpts: {
      rejectUnauthorized: false,
    },
  },

  s3: {
    credentials: {
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
    },
    endpoint: 'http://minio:9000',
    region: 'ignored',
    forcePathStyle: true,
    rejectUnauthorized: true,

    automaticallyCreateBuckets: true,

    // Names of buckets that Bailo uses
    buckets: {
      uploads: 'uploads',
      registry: 'registry',
    },
  },

  registry: {
    connection: {
      internal: 'https://registry:5000',
      insecure: true,
    },
  },

  smtp: {
    enabled: true,

    connection: {
      host: 'mailcrab',
      port: 1025,
      secure: false,
      auth: undefined,
      tls: {
        rejectUnauthorized: false,
      },
    },

    from: '"Bailo 📝" <bailo@example.org>',
  },

  avScanning: {
    clamdscan: {
      host: 'clamd',
    },

    modelscan: {
      host: 'modelscan',
    },
  },

  connectors: {
    fileScanners: {
      kinds: ['clamAV', 'modelScan'],
      retryDelayInMinutes: 60,
      maxInitRetries: 5,
      initRetryDelay: 5000,
    },
  },

  federation: {
    id: 'localBailo',
    state: 'enabled',
    peers: {
      huggingface: {
        state: 'enabled',
        baseUrl: 'https://huggingface.co',
        label: 'Hugging Face',
        kind: 'huggingfacehub',
        cache: {
          query: 60,
        },
        extra: {
          statusModelName: 'openai/whisper-large-v3',
          statusModelId: '654a84cadff2f49007ce6c37',
        },
      },
    },
  },
}
