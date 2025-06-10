import { PartialDeep } from '../../types/types.js'
import { Config } from '../config.js'

const config: PartialDeep<Config> = {
  app: {
    protocol: '',
    host: '',
    port: 3000,
  },
  federation: {
    state: 'disabled',
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
    fileScanners: {
      kinds: [],
    },
  },
  smtp: {
    enabled: true,
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
  log: {
    level: 'debug',
  },
  registry: {
    connection: {
      internal: 'https://localhost:5000',
    },
  },
  instrumentation: {
    enabled: false,
  },
  session: {
    secret: '',
  },
  oauth: {
    provider: 'cognito',
    grant: {
      defaults: {
        origin: '',
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
    },
  },
  avScanning: {
    clamdscan: {
      host: '127.0.0.1',
      port: 8080,
    },

    modelscan: {
      protocol: 'http',
      host: '127.0.0.1',
      port: 8081,
    },
  },
  mongo: {
    uri: 'mongodb://localhost:27017/bailo?directConnection=true',
    user: undefined,
    pass: undefined,
  },
  ui: {
    inference: {
      enabled: true,
    },
    modelDetails: {
      organisations: ['My Organisation'],
      states: ['Development', 'Review', 'Production'],
    },
  },
}

export default config
