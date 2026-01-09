import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import pluginCypress from 'eslint-plugin-cypress'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  ...nextVitals,
  {
    plugins: {
      prettier,
      'simple-import-sort': simpleImportSort,
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
