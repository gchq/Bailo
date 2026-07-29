import { Request, Response } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { RoleKeys, Roles } from '../../../src/connectors/authentication/constants.js'
import { OauthAuthenticationConnector } from '../../../src/connectors/authentication/oauth.js'
import { UserInterface } from '../../../src/models/User.js'
import config from '../../../src/utils/config.js'
import { toEntity } from '../../../src/utils/entity.js'

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
    const getEntityMembersSpy = vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce([user.dn])

    const result = await connector.hasRole(user, Roles.Compliance)

    expect(result).toBe(true)
    expect(getEntityMembersSpy).toHaveBeenCalledWith(toEntity('group', config.oauth.cognito.complianceGroupName))
  })

  test('hasRole > returns false if user is not in the compliance group', async () => {
    const connector = new OauthAuthenticationConnector()
    vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce([])

    const result = await connector.hasRole(user, Roles.Compliance)

    expect(result).toBe(false)
  })

  test('hasRole > returns true if user is in the untrusted model group (does not check admin)', async () => {
    const connector = new OauthAuthenticationConnector()
    const getEntityMembersSpy = vi.spyOn(connector, 'getEntityMembers').mockResolvedValueOnce([user.dn])

    const result = await connector.hasRole(user, Roles.UntrustedModel)

    expect(result).toBe(true)
    // Should short-circuit and never check the admin group
    expect(getEntityMembersSpy).toHaveBeenCalledTimes(1)
    expect(getEntityMembersSpy).toHaveBeenCalledWith(toEntity('group', config.oauth.cognito.untrustedModelGroupName))
  })

  test('hasRole > falls back to admin check if user is not in the untrusted model group', async () => {
    const connector = new OauthAuthenticationConnector()
    const getEntityMembersSpy = vi
      .spyOn(connector, 'getEntityMembers')
      .mockResolvedValueOnce([]) // untrusted model group check fails
      .mockResolvedValueOnce([user.dn]) // admin group check succeeds

    const result = await connector.hasRole(user, Roles.UntrustedModel)

    expect(result).toBe(true)
    expect(getEntityMembersSpy).toHaveBeenCalledTimes(2)
    expect(getEntityMembersSpy).toHaveBeenNthCalledWith(
      1,
      toEntity('group', config.oauth.cognito.untrustedModelGroupName),
    )
    expect(getEntityMembersSpy).toHaveBeenNthCalledWith(2, toEntity('group', config.oauth.cognito.adminGroupName))
  })

  test('hasRole > returns false if user is neither in the untrusted model group nor an admin', async () => {
    const connector = new OauthAuthenticationConnector()
    vi.spyOn(connector, 'getEntityMembers').mockResolvedValue([])

    const result = await connector.hasRole(user, Roles.UntrustedModel)

    expect(result).toBe(false)
  })

  test('hasRole > returns false for an unrecognised role', async () => {
    const connector = new OauthAuthenticationConnector()
    const getEntityMembersSpy = vi.spyOn(connector, 'getEntityMembers')

    const result = await connector.hasRole(user, 'SomeUnknownRole' as RoleKeys)

    expect(result).toBe(false)
    expect(getEntityMembersSpy).not.toHaveBeenCalled()
  })
})
