const config = {
  app: {
    api: {
      port: 123,
    },
    app: {
      protocol: '',
    },
  },
  logging: {
    stroom: {
      enabled: false,
    },
    file: {
      enabled: false,
    },
  },
  minio: {
    connection: {
      endPoint: 'fake',
    },
    buckets: {
      uploads: 'uploads',
    },
  },
  oauth: {
    enabled: false,
  },
  ui: {
    seldonVersions: [
      {
        name: 'seldonio - 1.10.0',
        image: 'seldonio/seldon-core-s2i-python37:1.10.0',
      },
    ],
    banner: '',
    registry: '',
  },
}

export default config
