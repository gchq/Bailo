module.exports = {
  mongo: {
    uri: 'mongodb://localhost:27017/bailo',
    connectionOptions: {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    },
  },

  minio: {
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    region: '',

    createBuckets: true,
    uploadBucket: 'uploads',
    registryBucket: 'registry',
  },

  registry: {
    host: 'localhost:8080',
    port: 8080,
    protocol: 'https',

    service: 'RegistryAuth',
    issuer: 'RegistryIssuer',

    insecure: true,
  },

  s2i: {
    path: '/s2i/s2i',
    builderImage: 'seldonio/seldon-core-s2i-python37:1.10.0',
  },

  build: {
    environment: 'img',
  },

  // overwritten via Helm charts
  openshift: {
    namespace: '',
    appPublicRoute: '',
    dockerPushSecretName: '',
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
    registry: {
      host: 'localhost:8080',
    },
    uploadWarning: {
      showWarning: true,
      checkboxText: 'By checking here you confirm that the information is correct',
    },
    deploymentWarning: {
      showWarning: true,
      checkboxText: 'By checking here you confirm that the information is correct',
    },
    development: {
      logUrl: 'vscode://file/home/ec2-user/git/Bailo/',
    },
    seldonVersions: [
      {
        name: 'seldonio - 1.10.0',
        image: 'seldonio/seldon-core-s2i-python37:1.10.0',
      },
    ],
  },

  smtp: {
    enabled: true,
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

  logging: {
    file: {
      enabled: false,
      level: 'info',
      path: './logs/out.log',
    },

    stroom: {
      enabled: false,
      folder: './logs/stroom',
      url: 'http://localhost:8090/stroom/datafeed',
      environment: 'insecure',
      feed: 'bailo',
      system: 'bailo',
      interval: 1000 * 60 * 5,
    },
  },

  app: {
    protocol: 'http',
    host: 'localhost',
    port: 8080,
  },

  listen: 3000,
}
