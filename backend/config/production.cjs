/** @type {import('../src/utils/config.js').Config} */
module.exports = {
  federation: {
    id: 'localBailo',
    state: 'enabled',
    isEscalationEnabled: true,
    peers: {
      localBailo: {
        state: 'enabled',
        baseUrl: 'http://second-bailo:8080',
        label: 'Second Bailo',
        kind: 'bailo',
        cache: {
          query: 60,
        },
        allowedProcUserIds: ['user'],
      },
    },
  },

  log: {
    level: 'debug',
  },
}
