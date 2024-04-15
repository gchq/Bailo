import { CognitoIdentityProviderClientConfig } from '@aws-sdk/client-cognito-identity-provider'
import bunyan from 'bunyan'
import _config from 'config'
import grant from 'grant'

import { AuditKindKeys } from '../connectors/audit/index.js'
import { AuthenticationKindKeys } from '../connectors/authentication/index.js'
import { AuthorisationKindKeys } from '../connectors/authorisation/index.js'
import { DefaultSchema } from '../services/schema.js'
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

  ui: {
    banner: {
      enabled: boolean
      text: string
      colour: string
      textColor: string
    }

    issues: {
      label: string
      supportHref: string
      contactHref: string
    }

    registry: {
      host: string
    }

    inference: {
      enabled: boolean
      connection: {
        host: string
      }

      gpus: { [key: string]: string }
    }
  }

  session: {
    secret: string
  }

  oauth: {
    provider: string
    grant: grant.GrantConfig | grant.GrantOptions
    cognito: {
      identityProviderClient: CognitoIdentityProviderClientConfig
      userPoolId: string
      userIdAttribute: string
    }
  }

  defaultSchemas: {
    modelCards: Array<DefaultSchema>
    accessRequests: Array<DefaultSchema>
  }

  instrumentation: {
    enabled: boolean
    serviceName: string
    endpoint: string
    authenticationToken: string
    debug: boolean
  }

  avScanning: {
    enabled: boolean
    clamdscan: {
      host: string
      port: number
    }
  }
}

const config: Config = _config.util.toObject()
export default deepFreeze(config) as Config
