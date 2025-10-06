import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'eslint/config'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import pluginCypress from 'eslint-plugin-cypress'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import eslintPluginNext from 'eslint-plugin-next'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  ...compat.config({
    extends: ['next', 'next/core-web-vitals'],
    settings: {
      next: {
        rootDir: 'frontend/',
      },
    },
  }),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  // ...fixupConfigRules(
  //   compat.extends(
  //     'eslint:recommended',
  //     'plugin:@typescript-eslint/eslint-recommended',
  //     'plugin:@typescript-eslint/recommended',
  //     'plugin:react/recommended',
  //     'plugin:react/jsx-runtime',
  //     // 'plugin:react-hooks/recommended',
  //     // 'next/core-web-vitals',
  //   ),
  // ),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'eslint-plugin-next': eslintPluginNext,
      'react-hooks': reactHooks,
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      prettier,
      'simple-import-sort': simpleImportSort,
    },
    //extends: ['react/recommended', 'react/jsx-runtime'],
    languageOptions: {
      parser: tsParser,
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
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
      cypress: pluginCypress,
    },
    rules: {
      'func-names': 'off',
    },
  },
])
