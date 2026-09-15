import { PartialDeep } from '../../types/types.js'
import { Config } from '../config.js'

/**
 * Default config for every test, applied by `test/testUtils/setupTestConfig.ts`.
 * Values track `config/default.cjs` except where marked `Fixture`. Keep every top-level key of
 * `Config` present, as the per-test revert only restores keys listed here.
 */
const config: PartialDeep<Config> = {
  api: {
    host: '',
    port: 3001,
  },
  app: {
    protocol: '',
    host: '',
    port: 3000,
    privateKey: 'privateKey',
    publicKey: 'publicKey',
    jwks: 'jwks',
  },
  httpClient: {
    defaultOpts: {
      rejectUnauthorized: true,
    },
  },
  federation: {
    state: 'disabled',
    id: 'localBailo',
    isEscalationEnabled: false,
    peers: {},
  },
  s3: {
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
    endpoint: 'http://seaweedfs:8333',
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
  connectors: {
    authentication: {
      kind: 'silly',
    },
    audit: {
      kind: 'silly',
    },
    authorisation: {
      kind: 'basic',
    },
    artefactScanners: {
      kinds: [],
      retryDelayInMinutes: 60,
      maxInitRetries: 5,
      initRetryDelay: 5000,
      scanTimeoutMs: 60_000,
    },
    metrics: {
      kind: 'simple',
    },
  },
  smtp: {
    // Fixture: exercises the send path by default
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
    lifecycle: {
      preReminderIntervals: ['1 day', '2 weeks', '10 weeks'],
      postReminderInterval: '1 day',
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
  registry: {
    connection: {
      internal: 'https://localhost:5000',
      insecure: true,
    },
    service: 'RegistryAuth',
    issuer: 'RegistryIssuer',
    insecure: true,
  },
  defaultSchemas: {
    modelCards: [],
    accessRequests: [],
    dataCards: [],
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
  instrumentation: {
    enabled: false,
    serviceName: 'backend',
    endpoint: '',
    authenticationToken: '',
    debug: false,
  },
  stroom: {
    sendEvents: true,
    url: 'https://url',
    environment: 'local',
    interval: 1000 * 50,
    generator: 'Generator',
    rejectUnauthorized: false,
    xmlns: 'default-namespace',
    schemaLocation: 'default-namespace file://schema-location.xsd',
    version: '1.0.0',
    // Fixture: keeps header assertions independent of deployed defaults
    headers: {},
  },
  session: {
    secret: '',
  },
  oauth: {
    provider: 'cognito',
    grant: {
      defaults: {
        origin: '',
        // Fixture: no leading slash, as the oauth connector snapshots expect
        prefix: 'api/connect',
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
      adminGroupName: 'admin',
      complianceGroupName: 'compliance',
      untrustedModelGroupName: 'untrusted-model',
    },
  },
  artefactScanning: {
    clamdscan: {
      host: '127.0.0.1',
      port: 8080,
      concurrency: 1,
      streamMaxLength: '10M',
    },

    artefactscan: {
      protocol: 'http',
      host: '127.0.0.1',
      port: 8081,
      concurrency: 1,
    },
  },
  mongo: {
    uri: 'mongodb://mock',
    user: undefined,
    pass: undefined,
    transactions: false,
  },
  ui: {
    banner: {
      enabled: false,
      text: '',
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
    inference: {
      // Fixture: makes inferencing routes reachable by default
      enabled: true,
      connection: {
        host: 'http://example.com',
      },
      authorizationTokenName: 'inferencing-token',
      gpus: {},
    },
    modelMirror: {
      import: {
        enabled: false,
        additionalInfoHeading: 'Additional information',
        originalAnswerHeading: 'Original answer',
      },
      export: {
        enabled: false,
        disclaimer: '## Example Agreement',
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
    lifecycle: {
      maxReviewInterval: '1 year',
    },
    modelDetails: {
      organisations: ['My Organisation'],
      states: ['Development', 'Review', 'Production'],
    },
    roleDisplayNames: {
      owner: 'Owner',
      contributor: 'Contributor',
      consumer: 'Consumer',
    },
    untrustedModel: {
      enabled: false,
      untrustedModelLongDescription: 'tbd',
      untrustedModelShortDescription: 'tbd',
      fileUploadGuidance: 'tbd',
    },
    llmImport: {
      enabled: false,
    },
  },
  modelMirror: {
    // Fixtures: short names keep tarball assertions readable
    metadataFile: 'meta.json',
    contentDirectory: 'content-dir',
    export: {
      concurrency: 1,
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
    // Fixture: non-empty, so the token guard passes by default
    authorisationToken: 'test',
  },
  llm: {
    endpoint: '',
    apiKey: '',
    model: '',
    maxTokens: 16384,
    timeoutMs: 120000,
    temperature: 0,
    // Fixture: stand-in for the real multi-paragraph prompt
    systemPrompt: 'Test system prompt',
  },
}

export default config
