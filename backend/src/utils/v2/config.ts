import bunyan from 'bunyan'
import _config from 'config'

export interface Config {
  connectors: {
    user: {
      kind: 'silly' | string
    }

    authorisation: {
      kind: 'silly' | string
    }
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
}

const config: Config = _config.util.toObject()
export default config
