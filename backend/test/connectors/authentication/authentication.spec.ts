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

describe('connectors > authentication', () => {
  test('silly', () => {
    const connector = getAuthenticationConnector(false)
    expect(connector.constructor.name).toBe('SillyAuthenticationConnector')
  })

  test('invalid', () => {
    const invalidConnector = 'invalid'
    configMock.connectors.authentication.kind = invalidConnector

    expect(() => getAuthenticationConnector(false)).toThrowError(
      `'${invalidConnector}' is not a valid authentication kind.`,
    )
  })
})
