import { describe, expect, test, vi } from 'vitest'

import TokenModel, { HashType } from '../../src/models/Token.js'

const bcryptMocks = vi.hoisted(() => ({
  compare: vi.fn((a, b, c) => c(null, true)),
}))
vi.mock('bcryptjs', () => ({ default: bcryptMocks }))

const sha256Mocks = vi.hoisted(() => ({
  digest: vi.fn(),
}))
vi.mock('crypto', () => ({ createHash: vi.fn(() => ({ update: vi.fn(() => sha256Mocks) })) }))

describe('models > Token', () => {
  test('compareToken > missing secret key', async () => {
    const token = new TokenModel()
    const result = await token.compareToken('abc')

    expect(result).false
  })

  test('compareToken > return bcrypt error thrown when comparing', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.Bcrypt
    bcryptMocks.compare.mockImplementationOnce((a, b, c) => c('Compare Error'))

    const result = token.compareToken('abc')

    expect(result).rejects.toThrowError('Compare Error')
  })

  test('compareToken > return error for unrecognised hash method', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = 'unknown method'

    const result = token.compareToken('abc')

    expect(result).rejects.toThrowError('Unexpected hash type: unknown method')
  })

  test('compareToken > return true on successful bcrypt comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.Bcrypt
    bcryptMocks.compare.mockImplementationOnce((a, b, c) => c(null, true))

    const result = await token.compareToken('abc')

    expect(result).true
  })

  test('compareToken > return false on unsuccessful bcrypt comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.Bcrypt
    bcryptMocks.compare.mockImplementationOnce((a, b, c) => c(null, false))

    const result = await token.compareToken('abc')

    expect(result).false
  })

  test('compareToken > return true on successful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce(token.secretKey)

    const result = await token.compareToken('abc')

    expect(result).true
  })

  test('compareToken > return true on successful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce(token.secretKey)

    const result = await token.compareToken('abc')

    expect(result).true
  })

  test('compareToken > return true on successful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce(token.secretKey)

    const result = await token.compareToken('abc')

    expect(result).true
  })

  test('compareToken > return false on unsuccessful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce('wrong value')

    const result = await token.compareToken('abc')

    expect(result).false
  })
})
