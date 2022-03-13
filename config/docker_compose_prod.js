module.exports = {
  mongo: {
    uri: 'mongodb://mongo:27017/bailo',
  },

  minio: {
    endPoint: 'minio',
  },

  redis: {
    host: 'redis',
  },

  registry: {
    host: 'registry:5000',
  },

  s2i: {
    path: '/s2i/s2i',
  },

  uiConfig: {
    banner: {
      enable: true,
      text: 'ENVIRONMENT: COMPOSE PRODUCTION',
      colour: 'black',
    },
  },

  smtp: {
    host: 'maildev',
    port: 25,
  },
}
