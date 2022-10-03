import type { Config } from '@jest/types'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig: Config.InitialOptions = {
  moduleNameMapper: {
    '^@/data/(.*)$': '<rootDir>/data/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
  },
  testPathIgnorePatterns: ['__tests__/__utils__', 'config'],
  bail: true,

  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],

  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/.next/',
    '<rootDir>/__tests__/',
    '<rootDir>/config/',
    '<rootDir>/coverage/',
    '<rootDir>/helm/',
    '<rootDir>/lib/', // pMongoQueue has its own tests
    '<rootDir>/server/scripts/',
    '<rootDir>/server/utils/test/',
    '<rootDir>/src/MuiForms/',
    '<rootDir>/scripts/',
  ],

  collectCoverageFrom: ['**/*.{js,jsx,ts,tsx}'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
