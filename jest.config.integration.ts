import type { Config } from '@jest/types'

const customJestConfig: Config.InitialOptions = {
  bail: true,
  testMatch: ['**/__tests__/selenium_tests/*.[jt]s?(x)'],
}

module.exports = customJestConfig
