import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:8080`,
    defaultCommandTimeout: 20000,
    video: false,
  },
})
