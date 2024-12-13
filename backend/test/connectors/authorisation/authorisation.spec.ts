import { describe, expect, test, vi } from 'vitest'

import { getAuthorisationConnector } from '../../../src/connectors/authorisation/index.js'
import { FileScanResult } from '../../../src/connectors/fileScanning/Base.js'

vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: {
    getUserModelRoles: vi.fn(),
  },
}))

const fileScanResult: FileScanResult = {
  state: 'complete',
  lastRunAt: new Date(),
  isInfected: false,
  toolName: 'Test',
}

const fileScanningMock = vi.hoisted(() => ({
  info: vi.fn(() => []),
  scan: vi.fn(() => new Promise(() => [fileScanResult])),
}))
vi.mock('../../src/connectors/fileScanning/index.js', async () => ({ default: fileScanningMock }))

const configMock = vi.hoisted(() => ({
  app: {
    protocol: 'http',
  },
  instrumentation: {
    enabled: false,
  },
  log: {
    level: 'info',
  },
  connectors: {
    authorisation: {
      kind: 'basic',
    },
    audit: {
      kind: 'silly',
    },
    fileScanners: {
      kinds: [],
    },
  },
  registry: {
    connection: {
      internal: 'https://localhost:5000',
    },
  },
}))
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('connectors > authorisation', () => {
  test('basic', () => {
    const connector = getAuthorisationConnector(false)
    expect(connector.constructor.name).toBe('BasicAuthorisationConnector')
  })
  test('invalid', () => {
    const invalidConnector = 'invalid'
    configMock.connectors.authorisation.kind = invalidConnector
    expect(() => getAuthorisationConnector(false)).toThrowError(
      `'${invalidConnector}' is not a valid authorisation kind.`,
    )
  })
})
