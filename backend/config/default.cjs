/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('../src/utils/config.js').Config} */
module.exports = {
  api: {
    host: '',

    port: 3001,
  },

  app: {
    protocol: '',
    host: '',
    port: 3000,

    privateKey: './certs/key.pem',
    publicKey: './certs/cert.pem',
    jwks: './certs/jwks.json',
  },

  httpClient: {
    defaultOpts: {
      rejectUnauthorized: true,
    },
    proxy: '',
    noProxy: ['localhost', '127.0.0.1'],
  },

  mongo: {
    uri: 'mongodb://localhost:27017/bailo?directConnection=true',
    user: undefined,
    pass: undefined,
    transactions: false,
  },

  registry: {
    connection: {
      internal: 'https://localhost:5000',
      insecure: true,
    },

    service: 'RegistryAuth',
    issuer: 'RegistryIssuer',

    insecure: true,
  },

  federation: {
    state: 'disabled',
  },

  smtp: {
    enabled: true,
    transporter: 'smtp',

    connection: {
      host: 'localhost',
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

  log: {
    level: 'debug',
  },

  defaultReviewRoles: [
    {
      name: 'Model Senior Responsible Officer',
      shortName: 'msro',
      kind: 'review',
      description: 'Reviewer',
      systemRole: 'owner',
    },
    {
      name: 'Model Technical Reviewer',
      shortName: 'mtr',
      kind: 'review',
      description: 'Reviewer',
      systemRole: 'owner',
    },
  ],

  defaultSchemas: {
    modelCards: [
      {
        name: 'Minimal Schema v10',
        id: 'minimal-general-v10',
        description:
          "This is the latest version of the default model card. It complies with all requirements laid out in the [AI Policy](https://example.com) as well as best practices recommended by 'Science and Research'.\n\nIf you're unsure which model card to pick, you'll likely want this one!",
        jsonSchema: require('../src/scripts/example_schemas/minimal_model_schema.json'),
        reviewRoles: ['msro', 'mtr'],
      },
    ],
    dataCards: [
      {
        name: 'Minimal Data Card Schema v10',
        id: 'minimal-data-card-v10',
        description:
          "This is the latest version of the default data card. It complies with all requirements laid out in the [AI Policy](https://example.com) as well as best practices recommended by 'Science and Research'.\n\nIf you're unsure which data card to pick, you'll likely want this one!",
        jsonSchema: require('../src/scripts/example_schemas/minimal_data_card_schema.json'),
      },
    ],
    accessRequests: [
      {
        name: 'Minimal Access Request Schema v10',
        id: 'minimal-access-request-general-v10',
        description:
          'This access request should be used for models that are being deployed by the same organisation that created it and MAY be being used for operational use cases.\n\n ✔ Development Work  \n ✔ Operational Deployments  \n ✖ Second Party Sharing',
        jsonSchema: require('../src/scripts/example_schemas/minimal_access_request_schema.json'),
        reviewRoles: ['msro'],
      },
    ],
  },

  session: {
    secret: '',
  },

  oauth: {
    provider: 'cognito',

    grant: {
      defaults: {
        origin: '',
        prefix: '/api/connect',
        transport: 'session',
      },

      cognito: {
        key: '',
        secret: '',
        dynamic: ['scope'],
        response: ['tokens', 'raw', 'jwt'],
        callback: '/',
        subdomain: '',
      },
    },
    cognito: {
      identityProviderClient: {
        region: 'eu-west-1',
        credentials: {
          accessKeyId: '',
          secretAccessKey: '',
        },
      },
      userPoolId: '',
      userIdAttribute: '',
      adminGroupName: '',
    },
  },

  avScanning: {
    clamdscan: {
      concurrency: 2,
      host: '127.0.0.1',
      port: 3310,
    },

    modelscan: {
      concurrency: 2,
      protocol: 'http',
      host: '127.0.0.1',
      port: 3311,
    },
  },

  ui: {
    banner: {
      enabled: true,
      text: 'DEVELOPMENT DEPLOYMENT',
      colour: 'orange',
      textColor: 'black',
    },

    issues: {
      label: 'Bailo Support Team',
      supportHref: 'mailto:hello@example.com?subject=Bailo%20Support',
      contactHref: 'mailto:hello@example.com?subject=Bailo%20Contact',
    },

    registry: {
      host: 'localhost:8080',
    },

    inference: {
      enabled: false,
      connection: {
        host: 'http://example.com',
      },
      authorizationTokenName: 'inferencing-token',
      gpus: {},
    },
    modelMirror: {
      import: {
        enabled: false,
      },
      export: {
        enabled: false,
        disclaimer: '## Example Agreement \n I agree that this model is suitable for exporting',
      },
    },

    announcement: {
      enabled: false,
      text: '',
      startTimestamp: '',
    },

    helpPopoverText: {
      manualEntryAccess: '',
    },

    modelDetails: {
      organisations: ['Example Organisation'],
      states: ['Development', 'Review', 'Production'],
    },

    roleDisplayNames: {
      owner: 'Owner',
      contributor: 'Contributor',
      consumer: 'Consumer',
    },
  },

  connectors: {
    authentication: {
      kind: 'silly',
    },

    authorisation: {
      kind: 'basic',
    },

    audit: {
      kind: 'silly',
    },

    fileScanners: {
      kinds: [],
      retryDelayInMinutes: 60,
      maxInitRetries: 5,
      initRetryDelay: 5000,
    },
  },

  s3: {
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
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

  instrumentation: {
    enabled: false,
    serviceName: 'backend',
    endpoint: '',
    authenticationToken: '',
    debug: false,
  },

  modelMirror: {
    metadataFile: 'metadata.json',
    contentDirectory: 'content',
    export: {
      concurrency: 5,
      maxSize: 100 * 1024 * 1024 * 1024,
      bucket: 'exports',
      kmsSignature: {
        enabled: false,
        keyId: '123-456',
        KMSClient: {
          region: 'eu-west-1',
          credentials: {
            accessKeyId: '',
            secretAccessKey: '',
          },
        },
      },
    },
  },

  inference: {
    authorisationToken: '',
  },
}
