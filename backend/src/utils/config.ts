import _config from 'config'

interface DefaultSchema {
  name: string
  reference: string
  schema: unknown
}

export interface Config {
  api: {
    port: number
    host: string
  }

  app: {
    protocol: string
    host: string
    port: number

    privateKey: string
    publicKey: string
  }

  s2i: {
    path: string
  }

  build: {
    environment: 'img' | 'openshift'

    openshift: {
      namespace: string
      dockerPushSecret: string
    }
  }

  mongo: {
    uri: string
  }

  minio: {
    connection: any

    automaticallyCreateBuckets: boolean

    buckets: {
      uploads: string
      registry: string
    }
  }

  registry: {
    connection: {
      host: string
      port: string
      protocol: string
    }

    service: string
    issuer: string

    insecure: boolean
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

  logging: {
    file: {
      enabled: boolean

      level: string
      path: string
    }

    stroom: {
      enabled: boolean

      folder: string
      url: string
      environment: string
      feed: string
      system: string

      interval: number
    }
  }

  defaultSchemas: {
    upload: Array<DefaultSchema>
    deployment: Array<DefaultSchema>
  }

  ui: {
    banner: {
      enabled: boolean
      text: string
      colour: string
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
    development: {
      logUrl: string
    }
    seldonVersions: Array<{
      name: string
      image: string
    }>
  }
}

const config: Config = {
  api: {
    port: _config.get('api.port'),
    host: _config.get('api.host'),
  },

  app: {
    protocol: _config.get('app.protocol'),
    host: _config.get('app.host'),
    port: _config.get('app.port'),

    publicKey: _config.get('app.publicKey'),
    privateKey: _config.get('app.privateKey'),
  },

  s2i: {
    path: _config.get('s2i.path'),
  },

  build: {
    environment: _config.get('build.environment'),

    openshift: {
      namespace: _config.get('build.openshift.namespace'),
      dockerPushSecret: _config.get('build.openshift.dockerPushSecret'),
    },
  },

  mongo: {
    uri: _config.get('mongo.uri'),
  },

  minio: {
    connection: _config.get('minio.connection'),

    automaticallyCreateBuckets: _config.get('minio.automaticallyCreateBuckets'),

    buckets: {
      uploads: _config.get('minio.buckets.uploads'),
      registry: _config.get('minio.buckets.registry'),
    },
  },

  registry: {
    connection: {
      host: _config.get('registry.connection.host'),
      port: _config.get('registry.connection.port'),
      protocol: _config.get('registry.connection.protocol'),
    },

    service: _config.get('registry.service'),
    issuer: _config.get('registry.issuer'),

    insecure: _config.get('registry.insecure'),
  },

  smtp: {
    enabled: _config.get('smtp.enabled'),

    connection: _config.get('smtp.connection'),

    from: _config.get('smtp.from'),
  },

  logging: {
    file: _config.get('logging.file'),
    stroom: _config.get('logging.stroom'),
  },

  defaultSchemas: _config.get('defaultSchemas'),

  ui: _config.get('ui'),
}

export default config
