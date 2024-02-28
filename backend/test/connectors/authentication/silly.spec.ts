import { describe, expect, test, vi } from 'vitest'

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
})
