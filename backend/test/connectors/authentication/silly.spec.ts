import { describe, expect, test, vi } from 'vitest'

import { Roles } from '../../../src/connectors/authentication/constants.js'
import { SillyAuthenticationConnector } from '../../../src/connectors/authentication/silly.js'

vi.mock('../../../src/routes/middleware/defaultAuthentication.js', () => ({
  getTokenFromAuthHeader: 'Token Middleware',
  checkAuthentication: 'Authentication Check Middleware',
}))

describe('connectors > authentication > silly', () => {
  test('authenticationMiddleware', async () => {
    const connector = new SillyAuthenticationConnector()
    const middleware = await connector.authenticationMiddleware()

    expect(middleware).toMatchSnapshot()
  })

  test('queryEntities', async () => {
    const connector = new SillyAuthenticationConnector()
    const queryResult = await connector.queryEntities('abc')

    expect(queryResult).matchSnapshot()
  })

  test('hasRole > returns true for Admin role', async () => {
    const connector = new SillyAuthenticationConnector()
    const result = await connector.hasRole({} as any, Roles.Admin)

    expect(result).toBe(true)
  })

  test('hasRole > returns true for Compliance role', async () => {
    const connector = new SillyAuthenticationConnector()
    const result = await connector.hasRole({} as any, Roles.Compliance)

    expect(result).toBe(true)
  })

  test('hasRole > returns false for an unrecognised role', async () => {
    const connector = new SillyAuthenticationConnector()
    const result = await connector.hasRole({} as any, 'unknown-role' as any)

    expect(result).toBe(false)
  })
})
