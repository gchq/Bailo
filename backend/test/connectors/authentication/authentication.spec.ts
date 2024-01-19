import { describe, expect, test, vi } from 'vitest'

import { getAuthenticationConnector } from '../../../src/connectors/v2/authentication/index.js'

const configMock = vi.hoisted(() => ({
  connectors: {
    authentication: {
      kind: 'silly',
    },
  },
}))
vi.mock('../../../src/utils/v2/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('connectors > user', () => {
  test('silly', () => {
    const connector = getAuthenticationConnector(false)
    expect(connector.constructor.name).toBe('SillyAuthenticationConnector')
  })

  test('invalid', () => {
    configMock.connectors.authentication.kind = 'invalid'

    expect(() => getAuthenticationConnector(false)).toThrowError('No valid authentication connector provided.')
  })
})
