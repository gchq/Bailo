import { defineConfig } from 'cypress'
import config from 'config'

export default defineConfig({
  e2e: {
    baseUrl: `${config.get('app.protocol')}://${config.get('app.host')}:${config.get('app.port')}`,
    video: false,
    defaultCommandTimeout: 10000,
  },
})
