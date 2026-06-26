import react from '@vitejs/plugin-react'
import { defineConfig, ViteUserConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()] as ViteUserConfig['plugins'],
  test: {
    globals: true,
    server: {
      deps: {
        inline: ['@mui/material', '@mui/icons-material', '@mui/system', '@mui/utils', '@mui/styled-engine'],
      },
    },
    environment: 'jsdom',
    setupFiles: ['./utils/test/testUtils.ts'],
  },
})
