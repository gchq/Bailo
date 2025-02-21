import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import cypress from 'eslint-plugin-cypress'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const eslintConfig = [
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react/jsx-runtime',
      'plugin:react-hooks/recommended',
      'next/core-web-vitals',
    ),
  ),
  ...compat
    .config({
      extends: ['plugin:cypress/recommended'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './cypress/tsconfig.json',
      },
    })
    .map((config) => ({ ...config, files: ['cypress/**/*.cy.ts'] })),
  {
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      prettier,
      'simple-import-sort': simpleImportSort,
    },

    languageOptions: {
      parser: tsParser,
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
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'no-console': 'warn',
    },
  },
  {
    files: ['cypress/**/*.cy.ts'],
    plugins: {
      cypress,
    },
    languageOptions: {
      globals: {
        ...cypress.environments.globals.globals,
      },
    },
    rules: {
      'func-names': 'off',
    },
  },
]

export default eslintConfig
