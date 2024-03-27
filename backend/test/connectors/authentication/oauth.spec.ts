import { Request, Response } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { OauthAuthenticationConnector } from '../../../src/connectors/authentication/oauth.js'

const mockCognitoClient = vi.hoisted(() => ({
  listUsers: vi.fn(),
}))
vi.mock('../../../src/clients/cognito.js', () => mockCognitoClient)

vi.mock('../../../src/routes/middleware/defaultAuthentication.js', () => ({
  getTokenFromAuthHeader: 'Token Middleware',
  checkAuthentication: 'Authentication Check Middleware',
}))

vi.mock('express-session', () => ({
  default: vi.fn(() => ({ session: 'session middleware' })),
}))

vi.mock('connect-mongo', () => ({ default: { create: vi.fn() } }))

vi.mock('body-parser', () => ({ default: { urlencoded: vi.fn(() => 'body parser middleware') } }))

vi.mock('grant', () => ({ default: { default: { express: vi.fn(() => 'grant middleware') } } }))

describe('connectors > authentication > oauth', () => {
  test('authenticationMiddleware > returns expected middleware', async () => {
    const connector = new OauthAuthenticationConnector()
    const middleware = await connector.authenticationMiddleware()

    expect(middleware).toMatchSnapshot()
  })

  test('getUser > user gets set with jwt content', async () => {
    const email = 'test@email.com'
    const request = {
      user: 'unchanged',
      session: { grant: { response: { jwt: { id_token: { payload: { email } } } } } },
    } as Request
    const next = vi.fn()

    const connector = new OauthAuthenticationConnector()
    await connector.getUser(request, {} as Response, next)

    expect(request.user).toEqual({ dn: email })
    expect(next).toBeCalled()
  })

  test('getUser > user does not get set if no jwt', async () => {
    const request = {
      user: 'unchanged',
      session: { grant: { response: {} } },
    } as Request
    const next = vi.fn()

    const connector = new OauthAuthenticationConnector()
    await connector.getUser(request, {} as Response, next)

    expect(request.user).toBeUndefined()
    expect(next).toBeCalled()
  })

  test('getRoutes > returns expected routes', async () => {
    const connector = new OauthAuthenticationConnector()
    const router = await connector.getRoutes()

    expect(router.stack).toMatchSnapshot()
  })

  test('queryEntities > returns in expected format', async () => {
    const user = { name: 'Joe Blogs', email: 'email@test.com', dn: 'dn' }
    mockCognitoClient.listUsers.mockReturnValueOnce([user])

    const connector = new OauthAuthenticationConnector()
    const entities = await connector.queryEntities('query')

    expect(entities).toEqual([{ kind: 'user', id: user.dn }])
  })

  test('getUserInformation > throws error if not a user', async () => {
    const connector = new OauthAuthenticationConnector()
    const response = connector.getUserInformation('group:name')

    expect(response).rejects.toThrowError('Cannot get user information for a non-user entity: group:name')
  })

  test('getUserInformation > returns user information', async () => {
    const user = { name: 'Joe Blogs', email: 'email@test.com' }
    mockCognitoClient.listUsers.mockReturnValueOnce([user])

    const connector = new OauthAuthenticationConnector()
    const userInfo = await connector.getUserInformation('user:name')

    expect(userInfo).toStrictEqual(user)
    expect(mockCognitoClient.listUsers).toBeCalledWith('name', true)
  })

  test('getUserInformation > throws error if more than one user is found', async () => {
    const user = { name: 'Joe Blogs', email: 'email@test.com', dn: 'dn' }
    mockCognitoClient.listUsers.mockReturnValueOnce([user, user])

    const connector = new OauthAuthenticationConnector()
    const response = connector.getUserInformation('user:name')

    expect(response).rejects.toThrowError('Cannot get user information. Found more than one user.')
  })

  test('getUserInformation > throws error no user is found', async () => {
    mockCognitoClient.listUsers.mockReturnValueOnce([])

    const connector = new OauthAuthenticationConnector()
    const response = connector.getUserInformation('user:name')

    expect(response).rejects.toThrowError('Cannot get user information. User not found.')
  })

  test('getEntityMembers > throws error if not a user', async () => {
    const connector = new OauthAuthenticationConnector()
    const response = connector.getEntityMembers('unknown:name')

    expect(response).rejects.toThrowError('Unable to get members, entity kind not recognised')
  })

  test('getEntityMembers > returns entity', async () => {
    const connector = new OauthAuthenticationConnector()
    const entity = await connector.getEntityMembers('user:name')

    expect(entity).toStrictEqual(['user:name'])
  })
})
