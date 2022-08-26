import type { Config } from '@jest/types'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const customJestConfig: Config.InitialOptions = {
  bail: true,
  testMatch: ['**/__tests__/selenium_tests/*.[jt]s?(x)'],
}

module.exports = createJestConfig(customJestConfig)
