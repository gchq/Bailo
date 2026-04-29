import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vitest/config'

// Required for https://github.com/gchq/Bailo/issues/3511
// may be removed once sub-dependency oxc supports ecma decorators
function decoratorPreset(options: Record<string, unknown>) {
  return {
    preset: () => ({
      plugins: [['@babel/plugin-proposal-decorators', options]],
    }),
    rolldown: {
      // Only run Babel on files containing decorators
      filter: {
        code: '@',
      },
    },
  }
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    babel({
      presets: [
        decoratorPreset({
          version: '2023-11',
        }),
      ],
    }),
  ],
  test: {
    typecheck: {
      enabled: true,
      tsconfig: 'backend/test/tsconfig.json',
    },
    restoreMocks: true,
    setupFiles: [
      './test/testUtils/zod.ts',
      './test/testUtils/setupTestConfig.ts',
      './test/testUtils/clearMocks.ts',
      './test/testUtils/setupMongooseModelMocks.ts',
    ],
    include: ['test/**/*.spec.ts'],
    coverage: {
      enabled: true,
      include: ['**/**/*.ts', '**/middleware/**/*.ts'],
    },
  },
})
