const nextJest = require('next/jest')

const esModules = ['axios', 'nanoid', 'lodash-es', 'p-mongo-queue']

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  moduleNameMapper: {
    '^@/data/(.*)$': '<rootDir>/data/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
  },
  testPathIgnorePatterns: ['__tests__/__utils__', 'config'],
  bail: true,

  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  resolver: 'jest-ts-webcompat-resolver',

  extensionsToTreatAsEsm: ['.ts', '.tsx'],

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
  transformIgnorePatterns: [`/node_modules/(?!(${esModules.join('|')})/)`],
}

module.exports = async () => {
  const jestConfig = await createJestConfig(customJestConfig)()
  return {
    ...jestConfig,
    transformIgnorePatterns: jestConfig.transformIgnorePatterns.filter((ptn) => ptn !== '/node_modules/'),
    // ['^.+\\.module\\.(css|sass|scss)$', '/node_modules/(?!(package1|package2)/']
  }
}
