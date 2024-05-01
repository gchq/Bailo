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

  minio: {
    connection: {
      endPoint: 'minio',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      region: '',
    },
  },

  registry: {
    connection: {
      internal: 'https://registry:5000',
      host: 'registry:5000',
      port: 5000,
      protocol: 'https',
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
    enabled: true,
    clamdscan: {
      host: 'clamd',
    },
  },
}
