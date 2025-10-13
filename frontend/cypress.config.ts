import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:8080`,
    defaultCommandTimeout: 10000,
    video: false,
    setupNodeEvents(on) {
      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message)

          return null
        },
        table(message) {
          // eslint-disable-next-line no-console
          console.table(message)

          return null
        },
      })
    },
  },
})
