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
}

const config: Config = _config.util.toObject()
export default config
