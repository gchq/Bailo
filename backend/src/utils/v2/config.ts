import bunyan from 'bunyan'
import _config from 'config'

import { deepFreeze } from './object.js'

export interface Config {
  app: {
    protocol: string
    host: string
    port: number
  }

  connectors: {
    user: {
      kind: 'silly' | string
    }

    authorisation: {
      kind: 'silly' | string
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
}

const config: Config = _config.util.toObject()
export default deepFreeze(config)
