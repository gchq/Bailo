import { describe, expect, test, vi } from 'vitest'

import {
  createToken,
  dropModelIdFromTokens,
  findTokenByAccessKey,
  findUserTokens,
  getTokenFromAuthHeader,
  getTokenLifetimeMs,
  getTokensForModel,
  isTokenExpired,
  removeToken,
} from '../../src/services/token.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'
import { setTestConfig } from '../testUtils/setupTestConfig.js'

vi.mock('../../src/connectors/authorisation/index.js')

const TokenModelMock = getTypedModelMock('TokenModel')

describe('services > token', () => {
  const testUser = { dn: 'user' } as any

  describe('lifetime and expiry', () => {
    const day = 24 * 60 * 60 * 1000

    test('getTokenLifetimeMs > defaults to 90 days', () => {
      expect(getTokenLifetimeMs()).toBe(90 * day)
    })

    test('getTokenLifetimeMs > empty lifetime disables expiry', () => {
      setTestConfig({ personalAccessToken: { lifetime: '' } })
      expect(getTokenLifetimeMs()).toBeUndefined()
    })

    test('getTokenLifetimeMs > invalid lifetime throws', () => {
      setTestConfig({ personalAccessToken: { lifetime: 'not a duration' } })
      expect(() => getTokenLifetimeMs()).toThrow(`Invalid personalAccessToken.lifetime: 'not a duration'`)
    })

    test('createToken > sets lastRenewed and no expiresAt', async () => {
      const before = Date.now()
      const token = await createToken(testUser, { description: 'd', scope: 'all', modelIds: [], actions: [] } as any)

      expect(token.lastRenewed).toBeInstanceOf(Date)
      expect(token.lastRenewed!.getTime()).toBeGreaterThanOrEqual(before)
      expect(token.lastRenewed!.getTime()).toBeLessThanOrEqual(Date.now())
      expect(token).not.toHaveProperty('expiresAt')
    })

    test('isTokenExpired > false within lifetime', () => {
      expect(isTokenExpired({ lastRenewed: new Date(Date.now() - day) } as any)).toBe(false)
    })

    test('isTokenExpired > true once lifetime has passed', () => {
      expect(isTokenExpired({ lastRenewed: new Date(Date.now() - 91 * day) } as any)).toBe(true)
    })

    test('isTokenExpired > a changed lifetime applies to existing tokens', () => {
      const token = { lastRenewed: new Date(Date.now() - 100 * day) } as any
      expect(isTokenExpired(token)).toBe(true)

      setTestConfig({ personalAccessToken: { lifetime: '365 days' } })
      expect(isTokenExpired(token)).toBe(false)
    })

    test('isTokenExpired > never expires when lifetime is empty', () => {
      setTestConfig({ personalAccessToken: { lifetime: '' } })
      expect(isTokenExpired({ lastRenewed: new Date(0) } as any)).toBe(false)
    })

    test('isTokenExpired > falls back to createdAt when lastRenewed is missing', () => {
      expect(isTokenExpired({ createdAt: new Date(Date.now() - 91 * day) } as any)).toBe(true)
    })

    test('isTokenExpired > fails closed without a reference date', () => {
      expect(isTokenExpired({} as any)).toBe(true)
    })
  })

  describe('getTokenFromAuthHeader > expiry', () => {
    const day = 24 * 60 * 60 * 1000
    const header = `Basic ${Buffer.from('BAC_key:BSK_secret').toString('base64')}`

    function mockFoundToken(lastRenewed: Date) {
      const token = { user: testUser.dn, lastRenewed, compareToken: vi.fn().mockResolvedValue(true) }
      TokenModelMock.findOne.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          then: (resolve: (val: any) => any) => resolve(token),
        }),
      })
      return token
    }

    test('accepts a token within its lifetime', async () => {
      const token = mockFoundToken(new Date(Date.now() - day))

      await expect(getTokenFromAuthHeader(header)).resolves.toEqual(token)
    })

    test('rejects a token past its lifetime even with a valid secret', async () => {
      mockFoundToken(new Date(Date.now() - 91 * day))

      await expect(getTokenFromAuthHeader(header)).rejects.toThrow('Token has expired')
    })
  })

  test('test that a token cannot create another token', async () => {
    const func = () => createToken({ ...testUser, token: { user: testUser.dn } as any }, {} as any)
    await expect(func).rejects.toThrow('A token cannot be used to create another token')
  })

  test('findUserTokens > success', async () => {
    await findUserTokens(testUser)

    expect(TokenModelMock.find).toHaveBeenCalledWith({ user: testUser.dn })
  })

  test('getTokensForModel > success', async () => {
    const modelId = 'modelId'

    await getTokensForModel(testUser, modelId)

    expect(TokenModelMock.find).toHaveBeenCalledWith({ user: testUser.dn, modelIds: modelId })
  })

  test('dropModelIdFromTokens > success', async () => {
    const modelId = 'modelId'
    const firstMocks = { delete: vi.fn(), save: vi.fn() }
    const secondMocks = { delete: vi.fn(), save: vi.fn() }

    await dropModelIdFromTokens(testUser, modelId, [
      { user: testUser.dn, modelIds: [modelId], ...firstMocks },
      { user: testUser.dn, modelIds: [modelId, 'anotherModelId'], ...secondMocks },
    ] as any[])

    expect(firstMocks.delete).toHaveBeenCalled()
    expect(firstMocks.save).not.toHaveBeenCalled()
    expect(secondMocks.delete).not.toHaveBeenCalled()
    expect(secondMocks.save).toHaveBeenCalled()
  })

  test('dropModelIdFromTokens > bad auth', async () => {
    await expect(() => dropModelIdFromTokens(testUser, 'modelId', [{ user: 'fakeUser' }] as any[])).rejects.toThrow(
      /^Only the token owner can modify the token./,
    )
  })

  test('removeToken > success', async () => {
    const mockDelete = vi.fn()
    const mockToken = { user: testUser.dn, delete: mockDelete }
    TokenModelMock.findOne.mockResolvedValueOnce(mockToken)

    const result = await removeToken(testUser, 'accessKey')

    expect(result).toEqual(mockToken)
    expect(mockDelete).toHaveBeenCalled()
  })

  test('removeToken > bad auth', async () => {
    TokenModelMock.findOne.mockResolvedValueOnce({})

    await expect(() => removeToken(testUser, 'accessKey')).rejects.toThrow(
      /^Only the token owner can remove the token./,
    )
  })

  test('findTokenByAccessKey > success', async () => {
    TokenModelMock.findOne.mockResolvedValueOnce({})

    const result = await findTokenByAccessKey('accessKey')

    expect(result).toEqual({})
    expect(TokenModelMock.findOne).toHaveBeenCalledWith({ accessKey: 'accessKey' })
  })

  test('findTokenByAccessKey > success plus includeSecretKey', async () => {
    const resolvedToken = {}
    const mockSelect = vi.fn().mockReturnValue({
      then: (resolve: (val: any) => any) => resolve(resolvedToken),
    })
    TokenModelMock.findOne.mockReturnValueOnce({
      select: mockSelect,
    })

    const result = await findTokenByAccessKey('accessKey', { includeSecretKey: true })

    expect(result).toEqual({})
    expect(mockSelect).toHaveBeenCalledWith('+secretKey')
  })
})
