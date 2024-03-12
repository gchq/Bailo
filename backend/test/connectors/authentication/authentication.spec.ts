import { describe, expect, test, vi } from 'vitest'

import { getAuthenticationConnector } from '../../../src/connectors/authentication/index.js'

const configMock = vi.hoisted(() => ({
  connectors: {
    authentication: {
      kind: 'silly',
    },
  },
}))
vi.mock('../../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

vi.mock('../../../src/connectors/authentication/Base.js', () => ({ BaseAuthenticationConnector: vi.fn() }))
vi.mock('../../../src/connectors/authentication/silly.js', () => ({
  SillyAuthenticationConnector: vi.fn(() => ({ constructor: { name: 'silly' } })),
}))
vi.mock('../../../src/connectors/authentication/oauth.js', () => ({
  OauthAuthenticationConnector: vi.fn(() => ({ constructor: { name: 'oauth' } })),
}))

describe('connectors > authentication', () => {
  test('silly', () => {
    const connector = getAuthenticationConnector(false)
    expect(connector.constructor.name).toBe('silly')
  })

  test('oauth', () => {
    configMock.connectors.authentication.kind = 'oauth'
    const connector = getAuthenticationConnector(false)
    expect(connector.constructor.name).toBe('oauth')
  })

  test('invalid', () => {
    const invalidConnector = 'invalid'
    configMock.connectors.authentication.kind = invalidConnector

    expect(() => getAuthenticationConnector(false)).toThrowError(
      `'${invalidConnector}' is not a valid authentication kind.`,
    )
  })
})
