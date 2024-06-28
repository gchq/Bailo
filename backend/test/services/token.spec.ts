import { describe, expect, test, vi } from 'vitest'

import { UserInterface } from '../../src/models/User.js'
import { createToken } from '../../src/services/token.js'

vi.mock('../../src/connectors/authorisation/index.js')

const mockToken = vi.hoisted(() => {
  const mockedMethods = {
    save: vi.fn(),
    deleteOne: vi.fn(),
    find: vi.fn(() => ({ sort: vi.fn(() => ['schema-1', 'schema-2']) })),
    findOne: vi.fn(),
  }

  const Token: any = vi.fn(() => ({
    save: mockedMethods.save,
  }))
  Token.find = mockedMethods.find
  Token.findOne = mockedMethods.findOne
  Token.deleteOne = mockedMethods.deleteOne

  return {
    ...mockedMethods,
    Token,
  }
})

vi.mock('../../src/models/Token.js', async () => {
  const actual = await vi.importActual('../../src/models/Token.js')
  return {
    ...actual,
    default: mockToken.Token,
  }
})

describe('services > token', () => {
  const testUser = { dn: 'user' } as UserInterface

  test('test that a token cannot create another token', async () => {
    const func = () => createToken({ ...testUser, token: { user: testUser.dn } as any }, {} as any)
    await expect(func).rejects.toThrowError('A token cannot be used to create another token')
  })
})
