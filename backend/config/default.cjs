/** @type {import('../src/utils/v2/config.js').Config} */
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
  },

  s2i: {
    // Path to the s2i binary
    path: '/s2i/s2i',
  },

  build: {
    // Environment to build in, can be 'img' or 'openshift'
    environment: 'img',

    // These settings only matter in OpenShift
    openshift: {
      // Build configs, secrets and builds will be triggered in this namespace
      namespace: '',
      // The name of the secret for the application to create to securely allow OpenShift to communicate with the Bailo registry
      dockerPushSecret: '',
    },
  },

  mongo: {
    // A mongo connection URI, can contain usernames, passwords, replica set information, etc.
    // See: https://www.mongodb.com/docs/manual/reference/connection-string/
    uri: 'mongodb://localhost:27017/bailo?directConnection=true',
  },

  minio: {
    // Connection information for an s3-compliant file store.  Settings are passed directly to 'minio', see reference for options:
    // https://min.io/docs/minio/linux/developers/javascript/API.html#constructor
    connection: {
      endPoint: 'minio',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      region: 'minio',
      partSize: 64 * 1024 * 1024,
    },

    // Automatically create the upload / registry bucket if they're not found?
    automaticallyCreateBuckets: true,

    // Names of buckets that Bailo uses
    buckets: {
      uploads: 'uploads',
      registry: 'registry',
    },
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

  logging: {
    // Log out to a file
    file: {
      enabled: false,
      level: 'info',
      path: './logs/out.log',
    },

    // Log out to a stroom instance
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

  defaultSchemas: {
    upload: [
      {
        name: 'Minimal Schema v10',
        reference: '/Minimal/General/v10',
        schema: require('../src/scripts/example_schemas/minimal_upload_schema.json'),
      },
    ],
    deployment: [
      {
        name: 'Minimal Deployment Schema v6',
        reference: '/Minimal/Deployment/v6',
        schema: require('../src/scripts/example_schemas/minimal_deployment_schema.json'),
      },
    ],
    v2: {
      modelCards: [
        {
          name: 'Minimal Schema v10',
          id: 'minimal-general-v10',
          description:
            "This is the latest version of the default model card for users from West. It complies with all requirements laid out in the [AI Policy](https://example.com) as well as best practices recommended by 'Science and Research'.\n\nIf you're unsure which model card to pick, you'll likely want this one!",
          jsonSchema: require('../src/scripts/example_schemas/minimal_model_schema.json'),
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
  },

  session: {
    secret: '',
  },

  oauth: {
    enabled: false,
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
  },

  // These settings are PUBLIC and shared with the UI
  ui: {
    // Show a banner at the top of the screen on all pages
    banner: {
      enabled: true,
      text: 'DEPLOYMENT: INSECURE',
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

    // A configurable checkbox on the last page when uploading a model
    uploadWarning: {
      showWarning: true,
      checkboxText: 'By checking here you confirm that the information is correct',
    },

    // A configurable checkbox on the last page when requesting a deployment
    deploymentWarning: {
      showWarning: true,
      checkboxText: 'By checking here you confirm that the information is correct',
    },

    // Used by some admin pages (e.g. the logs) to directly open the correct page in your IDE
    // Not needed in production
    development: {
      logUrl: 'vscode://file/home/ec2-user/git/Bailo/',
    },

    // The available seldon versions that can be used to build images
    seldonVersions: [
      {
        name: 'seldonio - 1.10.0',
        image: 'seldonio/seldon-core-s2i-python37:1.10.0',
      },
    ],
    maxModelSizeGB: 50,
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
  },

  log: {
    level: 'trace',
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

    // Names of buckets that Bailo uses
    buckets: {
      uploads: 'uploads',
      registry: 'registry',
    },
  },
}
