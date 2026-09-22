import { describe, expect, test, vi } from 'vitest'

import { ArtefactScanResult } from '../../../src/connectors/artefactScanning/Base.js'
import { AuthorisationKindKeys, getAuthorisationConnector } from '../../../src/connectors/authorisation/index.js'
import { ArtefactKind } from '../../../src/models/Scan.js'
import { setTestConfig } from '../../testUtils/setupTestConfig.js'

vi.mock('../../../src/services/model.js', () => ({
  default: {
    getModelSystemRoles: vi.fn(),
  },
}))

vi.mock('../../../src/connectors/authentication/index.js', () => ({}))

const artefactScanResult: ArtefactScanResult = {
  state: 'complete',
  lastRunAt: new Date(),
  toolName: 'Test',
  artefactKind: ArtefactKind.FILE,
}

const fileScanningMock = vi.hoisted(() => ({
  info: vi.fn(() => []),
  scan: vi.fn(() => new Promise(() => [artefactScanResult])),
}))
vi.mock('../../src/connectors/artefactScanning/index.js', async () => ({ default: fileScanningMock }))

describe('connectors > authorisation', () => {
  test('basic', () => {
    const connector = getAuthorisationConnector(false)
    expect(connector.constructor.name).toBe('BasicAuthorisationConnector')
  })
  test('invalid', () => {
    const invalidConnector = 'invalid'
    setTestConfig({ connectors: { authorisation: { kind: invalidConnector as AuthorisationKindKeys } } })
    expect(() => getAuthorisationConnector(false)).toThrow(`'${invalidConnector}' is not a valid authorisation kind.`)
  })
})
