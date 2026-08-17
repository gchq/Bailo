module.exports = {
  mongo: {
    uri: 'mongodb://bailoadmin:bailoadmin@mongo:27017/bailo?replicaSet=rs0&authSource=admin',
  },

  s3: {
    credentials: {
      accessKeyId: 'bailoadmin',
      secretAccessKey: 'bailoadmin',
    },
    endpoint: 'http://seaweedfs:8333',
    region: 'ignored',
    forcePathStyle: true,
    rejectUnauthorized: true,
  },

  smtp: {
    enabled: false,
  },

  logging: {
    file: {
      path: '/home/runner/work/Bailo/Bailo/logs/out.log',
    },
  },

  ui: {
    modelMirror: {
      import: {
        enabled: true,
      },
      export: {
        enabled: true,
        disclaimer: '## Example Agreement \n I agree that this model is suitable for exporting',
      },
    },
  },

  connectors: {
    artefactScanners: {
      kinds: []
    }
  },
}
