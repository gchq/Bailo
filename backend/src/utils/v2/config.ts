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
}

const config: Config = _config.util.toObject()
export default config
