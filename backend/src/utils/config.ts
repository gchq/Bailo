import { AgentOptions } from 'node:https'

import { ResponseChecksumValidation } from '@aws-sdk/middleware-flexible-checksums'
import { Provider } from '@aws-sdk/types'
import bunyan from 'bunyan'
import _config from 'config'
import grant from 'grant'

import { ArtefactScanKindKeys } from '../connectors/artefactScanning/index.js'
import { AuditKindKeys } from '../connectors/audit/index.js'
import { AuthenticationKindKeys } from '../connectors/authentication/index.js'
import { AuthorisationKindKeys } from '../connectors/authorisation/index.js'
import { DefaultReviewRole } from '../services/review.js'
import { DefaultSchema } from '../services/schema.js'
import { FederationStateKeys, RemoteFederationConfig, UiConfig } from '../types/types.js'
import { deepFreeze } from './object.js'

export type TransportOption = 'smtp' | 'aws'

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

    artefactScanners: {
      kinds: ArtefactScanKindKeys[]
      retryDelayInMinutes: number
      maxInitRetries: number
      initRetryDelay: number
    }
  }

  federation: {
    state: FederationStateKeys
    id: string
    isEscalationEnabled?: boolean
    peers: Record<string, RemoteFederationConfig>
  }

  smtp: {
    enabled: boolean
    transporter: TransportOption

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

  ses: {
    endpoint: string
    region: string
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
    responseChecksumValidation: ResponseChecksumValidation | Provider<ResponseChecksumValidation>

    automaticallyCreateBuckets: boolean

    multipartChunkSize: number

    buckets: {
      uploads: string
      registry: string
    }
  }

  mongo: {
    uri: string

    user: string
    pass: string

    transactions: boolean
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

  defaultReviewRoles: Array<DefaultReviewRole>

  instrumentation: {
    enabled: boolean
    serviceName: string
    endpoint: string
    authenticationToken: string
    debug: boolean
  }

  artefactScanning: {
    clamdscan: {
      concurrency: number
      host: string
      port: number
    }

    modelscan: {
      concurrency: number
      protocol: string
      host: string
      port: number
    }
  }

  modelMirror: {
    metadataFile: string
    contentDirectory: string
    export: {
      concurrency: number
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
