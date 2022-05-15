import type { Config } from '@jest/types'

const customJestConfig: Config.InitialOptions = {
  bail: true,
  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],
  testPathIgnorePatterns: ['__tests__/__utils__', 'config'],
}

module.exports = customJestConfig
