import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:8080`,
    defaultCommandTimeout: 10000,
    video: false,
  },
})
