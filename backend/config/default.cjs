/** @type {import('../src/utils/config.js').Config} */
module.exports = {
  api: {
    // Publicly accessible host
    host: '',

    // Port to listen on
    port: 3001,
  },

  app: {
    // Publicly accessible route to service
    protocol: '',
    host: '',
    port: 3000,

    // Typically generated from `npm run certs`
    privateKey: './certs/key.pem',
    publicKey: './certs/cert.pem',
    jwks: './certs/jwks.json',
  },

  mongo: {
    // A mongo connection URI, can contain replica set information, etc.
    // See: https://www.mongodb.com/docs/manual/reference/connection-string/

    // This is usually embedded in a config map, so do not put usernames and
    // passwords in the connection string.
    uri: 'mongodb://localhost:27017/bailo?directConnection=true',

    // Authentication details
    user: undefined,
    pass: undefined,
  },

  registry: {
    // Registry connection information should be the internal connection to the registry.
    connection: {
      internal: 'https://localhost:5000',
      host: 'localhost:5000',
      port: 5000,
      protocol: 'https',
      insecure: true,
    },

    // Service and Issuer must match those set in the registry configuration
    service: 'RegistryAuth',
    issuer: 'RegistryIssuer',

    // Allow self-signed certificates
    insecure: true,
  },

  smtp: {
    // Enable / disable all email sending
    enabled: true,

    // Connection information for an SMTP server.  Settings are passed directly to 'node-mailer', see reference for options:
    // https://nodemailer.com/smtp/#1-single-connection
    connection: {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: undefined,
      tls: {
        rejectUnauthorized: false,
      },
    },

    // Set the email address that Bailo should use, can be different from the SMTP server details.
    from: '"Bailo 📝" <bailo@example.org>',
  },

  log: {
    level: 'debug',
  },

  defaultSchemas: {
    modelCards: [
      {
        name: 'Minimal Schema v10',
        id: 'minimal-general-v10',
        description:
          "This is the latest version of the default model card. It complies with all requirements laid out in the [AI Policy](https://example.com) as well as best practices recommended by 'Science and Research'.\n\nIf you're unsure which model card to pick, you'll likely want this one!",
        jsonSchema: require('../src/scripts/example_schemas/minimal_model_schema.json'),
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
      },
    ],
  },

  session: {
    secret: '',
  },

  oauth: {
    provider: 'cognito',

    grant: {
      // Grant configuration options, provide any option from:
      // https://www.npmjs.com/package/grant
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
    },
  },

  avScanning: {
    clamdscan: {
      host: '127.0.0.1',
      port: 3310,
    },

    modelscan: {
      protocol: 'http',
      host: '127.0.0.1',
      port: 80,
    },
  },

  // These settings are PUBLIC and shared with the UI
  ui: {
    // Show a banner at the top of the screen on all pages
    banner: {
      enabled: true,
      text: 'DEVELOPMENT DEPLOYMENT',
      colour: 'orange',
      textColor: 'black',
    },

    // Contact details for the support team
    issues: {
      label: 'Bailo Support Team',
      supportHref: 'mailto:hello@example.com?subject=Bailo%20Support',
      contactHref: 'mailto:hello@example.com?subject=Bailo%20Contact',
    },

    // The publicly accessible location of the registry, including host and port
    registry: {
      host: 'localhost:8080',
    },

    inference: {
      enabled: false,
      conneciton: {
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

    // Names of buckets that Bailo uses
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
    export: {
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
