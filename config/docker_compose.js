module.exports = {
  mongo: {
    uri: 'mongodb://mongo:27017/model_management',
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

  kaniko: {
    path: '/kaniko/executor',
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
    port: 25,
  }
}
