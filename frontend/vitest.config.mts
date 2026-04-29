import react from '@vitejs/plugin-react'
import { defineConfig, ViteUserConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()] as ViteUserConfig['plugins'],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./utils/test/testUtils.ts'],
  },
})
