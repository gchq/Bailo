/** @type {import('../src/utils/config.js').Config} */
module.exports = {
  build: {
    environment: 'img',
  },

  mongo: {
    uri: 'mongodb://bailoadmin:bailoadmin@mongo:27017/bailo?replicaSet=rs0&authSource=admin',
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

    multipartChunkSize: 5 * 1024 * 1024,

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

  ses: {
    endpoint: 'ignored',
    region: 'ignored',
  },

  connectors: {},

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
