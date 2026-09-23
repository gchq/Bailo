import { describe, expect, test } from 'vitest'

import { AuditKindKeys, getAuditConnector } from '../../../src/connectors/audit/index.js'
import { setTestConfig } from '../../testUtils/setupTestConfig.js'

describe('connectors > audit', () => {
  test('silly', () => {
    const connector = getAuditConnector(false)
    expect(connector.constructor.name).toBe('SillyAuditConnector')
  })

  test('stdout', () => {
    setTestConfig({ connectors: { audit: { kind: 'stdout' } } })
    const connector = getAuditConnector(false)
    expect(connector.constructor.name).toBe('StdoutAuditConnector')
  })

  test('stroom', () => {
    setTestConfig({ connectors: { audit: { kind: 'stroom' } } })
    const connector = getAuditConnector(false)
    expect(connector.constructor.name).toBe('StroomAuditConnector')
  })

  test('invalid', () => {
    const invalidConnector = 'invalid'
    setTestConfig({ connectors: { audit: { kind: invalidConnector as AuditKindKeys } } })

    expect(() => getAuditConnector(false)).toThrow(`'${invalidConnector}' is not a valid audit kind.`)
  })
})
