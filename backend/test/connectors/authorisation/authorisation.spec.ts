import { describe, expect, test, vi } from 'vitest'

import { ArtefactScanResult } from '../../../src/connectors/artefactScanning/Base.js'
import { getAuthorisationConnector } from '../../../src/connectors/authorisation/index.js'

vi.mock('../../../src/services/model.js', () => ({
  default: {
    getModelSystemRoles: vi.fn(),
  },
}))

vi.mock('../../../src/connectors/authentication/index.js', () => ({}))

const artefactScanResult: ArtefactScanResult = {
  state: 'complete',
  lastRunAt: new Date(),
  isVulnerable: false,
  toolName: 'Test',
}

const fileScanningMock = vi.hoisted(() => ({
  info: vi.fn(() => []),
  scan: vi.fn(() => new Promise(() => [artefactScanResult])),
}))
vi.mock('../../src/connectors/artefactScanning/index.js', async () => ({ default: fileScanningMock }))

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
  smtp: {
    transporter: 'smtp',
    connection: {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: undefined,
      tls: {
        rejectUnauthorized: false,
      },
    },
    from: '"Bailo 📝" <bailo@example.org>',
  },
  connectors: {
    authorisation: {
      kind: 'basic',
    },
    audit: {
      kind: 'silly',
    },
    artefactScanners: {
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
