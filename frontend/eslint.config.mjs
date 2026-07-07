import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import pluginCypress from 'eslint-plugin-cypress'
import prettier from 'eslint-plugin-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  ...nextVitals,
  {
    plugins: {
      prettier,
      'simple-import-sort': simpleImportSort,
    },
    settings: {
      react: {
        version: '19',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/jsx-newline': [
        1,
        {
          prevent: true,
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-duplicate-imports': 'warn',
      'no-console': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      curly: ['error', 'all'],
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  {
    files: ['*.config.ts'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
  {
    files: [
      'actions/**/*.ts',
      'actions/**/*.tsx',
      'pages/**/*.ts',
      'pages/**/*.tsx',
      'src/**/*.ts',
      'src/**/*.tsx',
      'utils/**/*.ts',
      'utils/**/*.tsx',
    ],
    ignores: ['src/dayjsConfig.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dayjs',
              message:
                "Do not import dayjs directly from the npm package, use the pre-configured alias '@dayjs' e.g. `import dayjs from '@dayjs'` or for the type definition, `import type { Dayjs } from '@dayjs'`.",
              allowTypeImports: false,
            },
            {
              name: '@mui/icons-material',
              message:
                "Do not import from the @mui/icons-material barrel. Use per-icon imports instead, e.g. `import Add from '@mui/icons-material/Add'`. Barrel imports significantly slow down Vitest imports.",
            },
          ],
          patterns: ['dayjs/*'],
        },
      ],
    },
  },
  {
    files: ['cypress/**/*.cy.ts'],
    plugins: {
      cypress: pluginCypress,
    },
    rules: {
      'func-names': 'off',
    },
  },
  globalIgnores(['.node_modules/*', '.next/*']),
])
