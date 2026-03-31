import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const eslintConfig = [
  {
    ignores: ['**/node_modules', '**/dist'],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
      'simple-import-sort': simpleImportSort,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

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

      'no-unused-vars': 'off',
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'no-duplicate-imports': 'warn',
      'no-console': 'warn',
      curly: ['error', 'all'],
    },
  },

  // Restrict Zod imports in src/
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['test/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'zod',
              message:
                'Do not import runtime values from "zod". `import { z } from "src/lib/zod.js"` instead so OpenAPI extensions are applied. `import type { ... } from "zod"` is permitted.',
              /**
               * Allow type-only imports:
               *   import type { ZodSchema } from "zod"
               */
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  // Exception: Zod bootstrap file
  {
    files: ['src/lib/zod.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]

export default eslintConfig
