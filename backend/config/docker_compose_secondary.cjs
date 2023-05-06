/** @type {import('../src/utils/config.js').Config} */
module.exports = {
  api: {
    port: 4001,
  },

  app: {
    port: 4000,

    // Typically generated from `npm run certs`
    privateKey: '/certs/key.pem',
    publicKey: '/certs/cert.pem',
  },

  build: {
    environment: 'img',
  },

  mongo: {
    uri: 'mongodb://mongo:27017/bailo_secondary',
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

    buckets: {
      uploads: 'uploads-secondary',
      registry: 'registry-secondary',
    },
  },

  registry: {
    connection: {
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
      auth: {
        user: '',
        pass: '',
      },
      tls: {
        rejectUnauthorized: false,
      },
    },

    from: '"Bailo Secondary 📝" <bailo_secondary@example.org>',
  },

  ui: {
    federation: {
      enabled: true,

      local: {
        name: 'Secondary',
        id: 'secondary',
      },

      remotes: [
        {
          name: 'Primary',
          id: 'primary',
          host: 'http://backend:3001',
        },
      ],
    },
  },
}
