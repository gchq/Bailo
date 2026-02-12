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
    privateKey: '/certs/key.pem',
    publicKey: '/certs/cert.pem',
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
    transporter: 'smtp',

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

  ses: {
    endpoint: 'ignored',
    region: 'ignored',
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
}
