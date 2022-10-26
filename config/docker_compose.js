module.exports = {
  mongo: {
    uri: 'mongodb://mongo:27017/bailo',
  },

  minio: {
    endPoint: 'minio',
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
      text: 'ENVIRONMENT: COMPOSE DEVELOPMENT',
      colour: 'black',
    },
  },

  smtp: {
    host: 'maildev',
    port: 1025,
  },
}
