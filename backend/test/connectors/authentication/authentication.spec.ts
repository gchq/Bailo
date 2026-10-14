import { describe, expect, test, vi } from 'vitest'

import { AuthenticationKindKeys, getAuthenticationConnector } from '../../../src/connectors/authentication/index.js'
import { setTestConfig } from '../../testUtils/setupTestConfig.js'

vi.mock('../../../src/connectors/authentication/Base.js', () => ({ BaseAuthenticationConnector: vi.fn() }))
vi.mock('../../../src/connectors/authentication/silly.js', () => ({
  SillyAuthenticationConnector: vi.fn(function () {
    return {
      constructor: { name: 'silly' },
    }
  }),
}))
vi.mock('../../../src/connectors/authentication/oauth.js', () => ({
  OauthAuthenticationConnector: vi.fn(function () {
    return {
      constructor: { name: 'oauth' },
    }
  }),
}))

describe('connectors > authentication', () => {
  test('silly', () => {
    const connector = getAuthenticationConnector(false)
    expect(connector.constructor.name).toBe('silly')
  })

  test('oauth', () => {
    setTestConfig({ connectors: { authentication: { kind: 'oauth' } } })
    const connector = getAuthenticationConnector(false)
    expect(connector.constructor.name).toBe('oauth')
  })

  test('invalid', () => {
    const invalidConnector = 'invalid'
    setTestConfig({ connectors: { authentication: { kind: invalidConnector as AuthenticationKindKeys } } })

    expect(() => getAuthenticationConnector(false)).toThrow(`'${invalidConnector}' is not a valid authentication kind.`)
  })
})
