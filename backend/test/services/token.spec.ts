import { describe, expect, test, vi } from 'vitest'

import {
  createToken,
  dropModelIdFromTokens,
  findTokenByAccessKey,
  findUserTokens,
  getTokensForModel,
  removeToken,
} from '../../src/services/token.js'
import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

vi.mock('../../src/connectors/authorisation/index.js')

const TokenModelMock = getTypedModelMock('TokenModel')

describe('services > token', () => {
  const testUser = { dn: 'user' } as any

  test('test that a token cannot create another token', async () => {
    const func = () => createToken({ ...testUser, token: { user: testUser.dn } as any }, {} as any)
    await expect(func).rejects.toThrowError('A token cannot be used to create another token')
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
    await expect(() =>
      dropModelIdFromTokens(testUser, 'modelId', [{ user: 'fakeUser' }] as any[]),
    ).rejects.toThrowError(/^Only the token owner can modify the token./)
  })

  test('removeToken > success', async () => {
    const mockDelete = vi.fn()
    TokenModelMock.findOne.mockResolvedValueOnce({ user: testUser.dn, delete: mockDelete })

    const result = await removeToken(testUser, 'accessKey')

    expect(result).toEqual({ success: true })
    expect(mockDelete).toHaveBeenCalled()
  })

  test('removeToken > bad auth', async () => {
    TokenModelMock.findOne.mockResolvedValueOnce({})

    await expect(() => removeToken(testUser, 'accessKey')).rejects.toThrowError(
      /^Only the token owner can remove the token./,
    )
  })

  test('findTokenByAccessKey > success', async () => {
    TokenModelMock.findOne.mockResolvedValueOnce({})

    const result = await findTokenByAccessKey('accessKey')

    expect(result).toEqual({})
    expect(TokenModelMock.findOne).toBeCalledWith({ accessKey: 'accessKey' })
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
