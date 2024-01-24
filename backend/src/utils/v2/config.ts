import bunyan from 'bunyan'
import _config from 'config'

import { AuditKindKeys } from '../../connectors/v2/audit/Base.js'
import { AuthenticationKindKeys } from '../../connectors/v2/authentication/index.js'
import { AuthorisationKindKeys } from '../../connectors/v2/authorisation/index.js'
import { deepFreeze } from './object.js'

export interface Config {
  app: {
    protocol: string
    host: string
    port: number
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

    buckets: {
      uploads: string
      registry: string
    }
  }

  registry: {
    connection: {
      internal: string
      insecure: boolean
    }
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

    uploadWarning: {
      showWarning: boolean
      checkboxText: string
    }

    deploymentWarning: {
      showWarning: boolean
      checkboxText: string
    }

    // Used by some admin pages (e.g. the logs) to directly open the correct page in your IDE
    // Not needed in production
    development: {
      logUrl: string
    }

    // The available seldon versions that can be used to build images
    seldonVersions: [
      {
        name: string
        image: string
      },
    ]
    maxModelSizeGB: number
  }
}

const config: Config = _config.util.toObject()
export default deepFreeze(config) as Config
