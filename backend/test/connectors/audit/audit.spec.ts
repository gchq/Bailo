import { describe, expect, test, vi } from 'vitest'

import { getAuditConnector } from '../../../src/connectors/audit/index.js'

const configMock = vi.hoisted(() => ({
  connectors: {
    audit: {
      kind: 'silly',
    },
  },
}))
vi.mock('../../../src/utils/v2/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('connectors > audit', () => {
  test('silly', () => {
    const connector = getAuditConnector(false)
    expect(connector.constructor.name).toBe('SillyAuditConnector')
  })

  test('stdout', () => {
    configMock.connectors.audit.kind = 'stdout'
    const connector = getAuditConnector(false)
    expect(connector.constructor.name).toBe('StdoutAuditConnector')
  })

  test('invalid', () => {
    const invalidConnector = 'invalid'
    configMock.connectors.audit.kind = invalidConnector

    expect(() => getAuditConnector(false)).toThrowError(`'${invalidConnector}' is not a valid audit kind.`)
  })
})
