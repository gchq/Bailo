module.exports = {
  mongo: {
    uri: 'mongodb://localhost:27017/bailo',
  },

  minio: {
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    region: '',

    uploadBucket: 'uploads',
    registryBucket: 'registry',
  },

  redis: {
    host: 'localhost',
  },

  registry: {
    host: 'localhost:8080',
    port: 8080,

    service: 'RegistryAuth',
    issuer: 'RegistryIssuer',

    insecure: true,
  },

  s2i: {
    path: 's2i',
  },

  kaniko: {
    path: 'kaniko_executor',
  },

  uiConfig: {
    banner: {
      enable: true,
      text: 'DEPLOYMENT: INSECURE',
      colour: 'orange',
    },
    issues: {
      label: 'Bailo Support Team',
      supportHref: 'mailto:hello@example.com?subject=Bailo%20Support',
      contactHref: 'mailto:hello@example.com?subject=Bailo%20Contact',
    },
    help: {
      documentationUrl: 'https://example.com',
    },
    registry: {
      host: 'localhost:8080',
    },
  },

  smtp: {
    host: 'localhost',
    port: 1025,
    secure: false,
    auth: {
      user: 'mailuser',
      pass: 'mailpass',
    },
    tls: {
      rejectUnauthorized: false,
    },

    from: '"Bailo 📝" <bailo@example.org>',
  },

  app: {
    protocol: 'http',
    host: 'localhost',
    port: 8080,
  },

  listen: 3000,
}
