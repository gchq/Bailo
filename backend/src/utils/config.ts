import { AgentOptions } from 'node:https'

import bunyan from 'bunyan'
import _config from 'config'
import grant from 'grant'

import { AuditKindKeys } from '../connectors/audit/index.js'
import { AuthenticationKindKeys } from '../connectors/authentication/index.js'
import { AuthorisationKindKeys } from '../connectors/authorisation/index.js'
import { FileScanKindKeys } from '../connectors/fileScanning/index.js'
import { DefaultSchema } from '../services/schema.js'
import { FederationStateKeys, RemoteFederationConfig, UiConfig } from '../types/types.js'
import { deepFreeze } from './object.js'

export interface Config {
  api: {
    host: string
    port: number
  }

  app: {
    protocol: string
    host: string
    port: number

    privateKey: string
    publicKey: string
    jwks: string
  }

  httpClient: {
    defaultOpts: AgentOptions
  }

  connectors: {
    authentication: {
      kind: AuthenticationKindKeys
    }

    authorisation: {
      kind: AuthorisationKindKeys
    }

    audit: {
      kind: AuditKindKeys
    }

    fileScanners: {
      kinds: FileScanKindKeys[]
      retryDelayInMinutes: number
      maxInitRetries: number
      initRetryDelay: number
    }
  }

  federation: {
    state: FederationStateKeys
    id: string
    peers: Map<string, RemoteFederationConfig>
  }

  smtp: {
    enabled: boolean

    connection: {
      host: string
      port: number
      secure: boolean
      auth: {
        user: string
        pass: string
      }
      tls: {
        rejectUnauthorized: boolean
      }
    }

    from: string
  }

  log: {
    level: bunyan.LogLevel
  }

  s3: {
    credentials: {
      accessKeyId: string
      secretAccessKey: string
    }

    endpoint: string
    region: string
    forcePathStyle: boolean
    rejectUnauthorized: boolean

    automaticallyCreateBuckets: boolean

    buckets: {
      uploads: string
      registry: string
    }
  }

  mongo: {
    uri: string

    user: string
    pass: string
  }

  registry: {
    connection: {
      internal: string
      insecure: boolean
    }

    service: string
    issuer: string

    insecure: boolean
  }

  ui: UiConfig

  session: {
    secret: string
  }

  oauth: {
    provider: string
    grant: grant.GrantConfig | grant.GrantOptions
    cognito: {
      identityProviderClient: { region: string; credentials: { accessKeyId: string; secretAccessKey: string } }
      userPoolId: string
      userIdAttribute: string
      adminGroupName: string
    }
  }

  defaultSchemas: {
    modelCards: Array<DefaultSchema>
    accessRequests: Array<DefaultSchema>
    dataCards: Array<DefaultSchema>
  }

  instrumentation: {
    enabled: boolean
    serviceName: string
    endpoint: string
    authenticationToken: string
    debug: boolean
  }

  avScanning: {
    clamdscan: {
      host: string
      port: number
    }

    modelscan: {
      protocol: string
      host: string
      port: number
    }
  }

  modelMirror: {
    export: {
      maxSize: number
      bucket: string
      kmsSignature: {
        enabled: boolean
        keyId: string
        KMSClient: {
          region: string
          credentials: {
            accessKeyId: string
            secretAccessKey: string
          }
        }
      }
    }
  }

  inference: {
    authorisationToken: string
  }
}

const config: Config = _config.util.toObject()
export default deepFreeze(config) as Config
