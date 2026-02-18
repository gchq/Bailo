/** @type {import('../src/utils/config.js').Config} */
module.exports = {
  federation: {
    id: 'localBailo',
    state: 'enabled',
    isEscalationEnabled: true,
    peers: {
      huggingface: {
        state: 'enabled',
        baseUrl: 'https://huggingface.co',
        label: 'Hugging Face',
        kind: 'huggingfacehub',
        cache: {
          query: 60,
        },
        extra: {
          statusModelName: 'openai/whisper-large-v3',
          statusModelId: '654a84cadff2f49007ce6c37',
        },
      },
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
