import express, { Request, Response } from 'express'
import supertest from 'supertest'
import { describe, expect, test, vi } from 'vitest'

import { RoleKeys, Roles } from '../../../src/connectors/authentication/constants.js'
import { OauthAuthenticationConnector } from '../../../src/connectors/authentication/oauth.js'
import { UserInterface } from '../../../src/models/User.js'
import config from '../../../src/utils/config.js'
import { toEntity } from '../../../src/utils/entity.js'

const mockCognitoClient = vi.hoisted(() => ({
  listUsers: vi.fn(),
  getGroupMembership: vi.fn(),
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

const user = { dn: 'user-dn' } as UserInterface

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
    expect(next).toHaveBeenCalled()
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
    expect(next).toHaveBeenCalled()
  })

  test('getRoutes > returns expected routes', async () => {
    const connector = new OauthAuthenticationConnector()
    const router = await connector.getRoutes()

    expect(router.stack).toMatchSnapshot()
  })

  test.each([
    ['/model/example?tab=files#content', '/model/example?tab=files#content'],
    ['https://malicious.example/path', '/'],
    ['//malicious.example/path', '/'],
    ['not-a-path', '/'],
  ])(
    'getRoutes > redirects through login and returns to a safe location',
    async (requestedRedirect, expectedRedirect) => {
      const session = { grant: undefined, loginRedirect: undefined as string | undefined }
      const app = express()
      app.use((req, _res, next) => {
        req.session = session as Request['session']
        next()
      })
      app.use(new OauthAuthenticationConnector().getRoutes())

      const loginResponse = await supertest(app).get('/api/login').query({ redirect: requestedRedirect })

      expect(loginResponse.status).toBe(302)
      expect(loginResponse.headers.location).toBe(`/api/connect/${config.oauth.provider}/login`)
      expect(session.loginRedirect).toBe(expectedRedirect)

      const callbackResponse = await supertest(app).get('/api/login/callback')

      expect(callbackResponse.status).toBe(302)
      expect(callbackResponse.headers.location).toBe(expectedRedirect)
      expect(session.loginRedirect).toBeUndefined()
    },
  )

  test('getRoutes > callback defaults to the home page when no redirect was stored', async () => {
    const app = express()
    app.use((req, _res, next) => {
      req.session = { grant: undefined } as Request['session']
      next()
    })
    app.use(new OauthAuthenticationConnector().getRoutes())

    const response = await supertest(app).get('/api/login/callback')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/')
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

    await expect(response).rejects.toThrow('Cannot get user information for a non-user entity: group:name')
  })

  test('getUserInformation > returns user information', async () => {
    const user = { name: 'Joe Blogs', email: 'email@test.com' }
    mockCognitoClient.listUsers.mockReturnValueOnce([user])

    const connector = new OauthAuthenticationConnector()
    const userInfo = await connector.getUserInformation('user:name')

    expect(userInfo).toStrictEqual(user)
    expect(mockCognitoClient.listUsers).toHaveBeenCalledWith('name', true)
  })

  test('getUserInformation > throws error if more than one user is found', async () => {
    const user = { name: 'Joe Blogs', email: 'email@test.com', dn: 'dn' }
    mockCognitoClient.listUsers.mockReturnValueOnce([user, user])

    const connector = new OauthAuthenticationConnector()
    const response = connector.getUserInformation('user:name')

    await expect(response).rejects.toThrow('Cannot get user information. Found more than one user.')
  })

  test('getUserInformation > throws error no user is found', async () => {
    mockCognitoClient.listUsers.mockReturnValueOnce([])

    const connector = new OauthAuthenticationConnector()
    const response = connector.getUserInformation('user:name')

    await expect(response).rejects.toThrow('Cannot get user information. User not found.')
  })

  test('getEntityMembers > throws error if not a user', async () => {
    const connector = new OauthAuthenticationConnector()
    const response = connector.getEntityMembers('unknown:name')

    await expect(response).rejects.toThrow('Unable to get members, entity kind not recognised')
  })

  test('getEntityMembers > returns entity', async () => {
    const connector = new OauthAuthenticationConnector()
    const entity = await connector.getEntityMembers('user:name')

    expect(entity).toStrictEqual(['user:name'])
  })

  test('hasRole > returns true if user is in the admin group', async () => {
    const connector = new OauthAuthenticationConnector()
    const getEntityMembersSpy = vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce([user.dn])

    const result = await connector.hasRole(user, Roles.Admin)

    expect(result).toBe(true)
    expect(getEntityMembersSpy).toHaveBeenCalledWith(toEntity('group', config.oauth.cognito.adminGroupName))
  })

  test('hasRole > returns false if user is not in the admin group', async () => {
    const connector = new OauthAuthenticationConnector()
    vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce(['someone-else'])

    const result = await connector.hasRole(user, Roles.Admin)

    expect(result).toBe(false)
  })

  test('hasRole > returns true if user is in the compliance group', async () => {
    const connector = new OauthAuthenticationConnector()
    const getEntityMembersSpy = vi
      .spyOn(connector, 'getEntityMembers')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([user.dn])

    const result = await connector.hasRole(user, Roles.Compliance)

    expect(result).toBe(true)
    expect(getEntityMembersSpy).toHaveBeenCalledWith(toEntity('group', config.oauth.cognito.complianceGroupName))
  })

  test('hasRole > returns false if user is not in the compliance group', async () => {
    const connector = new OauthAuthenticationConnector()
    vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce([]).mockResolvedValueOnce([])

    const result = await connector.hasRole(user, Roles.Compliance)

    expect(result).toBe(false)
  })

  test('hasRole > admin access grants untrusted model role', async () => {
    const connector = new OauthAuthenticationConnector()
    const getEntityMembersSpy = vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce([user.dn])

    const result = await connector.hasRole(user, Roles.UntrustedModel)

    expect(result).toBe(true)
    expect(getEntityMembersSpy).toHaveBeenCalledTimes(1)
    expect(getEntityMembersSpy).toHaveBeenCalledWith(toEntity('group', config.oauth.cognito.adminGroupName))
  })

  test('hasRole > returns false if user is neither in the untrusted model group nor an admin', async () => {
    const connector = new OauthAuthenticationConnector()
    vi.spyOn(connector, 'getEntityMembers').mockResolvedValue([])

    const result = await connector.hasRole(user, Roles.UntrustedModel)

    expect(result).toBe(false)
  })

  test('hasRole > returns false for an unrecognised role', async () => {
    const connector = new OauthAuthenticationConnector()
    const getEntityMembersSpy = vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce([])

    const result = await connector.hasRole(user, 'SomeUnknownRole' as RoleKeys)

    expect(result).toBe(false)
    expect(getEntityMembersSpy).toHaveBeenCalledTimes(1)
    expect(getEntityMembersSpy).toHaveBeenCalledWith(toEntity('group', config.oauth.cognito.adminGroupName))
  })
})
