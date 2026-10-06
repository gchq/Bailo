import { describe, expect, test, vi } from 'vitest'

vi.unmock('../../src/models/Token.ts')
import TokenModel from '../../src/models/Token.js'
import { HashType } from '../../src/services/hash.js'

const bcryptMocks = vi.hoisted(() => ({
  compare: vi.fn(),
}))
vi.mock('bcryptjs', () => ({ default: bcryptMocks }))

const baseScannerMock = vi.hoisted(() => ({
  ArtefactScanState: {
    NotScanned: 'notScanned',
    InProgress: 'inProgress',
    Complete: 'complete',
    Error: 'error',
  },
}))
vi.mock('../../src/connectors/artefactScanning/Base.js', () => baseScannerMock)

const sha256Mocks = vi.hoisted(() => ({
  digest: vi.fn(),
}))
const timingSafeEqualMock = vi.hoisted(() => vi.fn())

vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({ update: vi.fn(() => sha256Mocks) })),
  timingSafeEqual: timingSafeEqualMock,
  randomBytes: vi.fn(),
  argon2: vi.fn(),
}))

describe('models > Token', () => {
  test('compareToken > missing secret key', async () => {
    const token = new TokenModel()
    const result = await token.compareToken('abc')

    expect(result).toBe(false)
  })

  test('compareToken > return bcrypt error thrown when comparing', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.Bcrypt
    bcryptMocks.compare.mockRejectedValueOnce(new Error('Compare Error'))

    const result = token.compareToken('abc')

    await expect(result).rejects.toThrow('Compare Error')
  })

  test('compareToken > return error for unrecognised hash method', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = 'unknown method'

    const result = token.compareToken('abc')

    await expect(result).rejects.toThrow('Unexpected hash type: unknown method')
  })

  test('compareToken > return true on successful bcrypt comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.Bcrypt
    bcryptMocks.compare.mockResolvedValueOnce(true)

    const result = await token.compareToken('abc')

    expect(result).toBe(true)
  })

  test('compareToken > return false on unsuccessful bcrypt comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.Bcrypt
    bcryptMocks.compare.mockResolvedValueOnce(false)

    const result = await token.compareToken('abc')

    expect(result).toBe(false)
  })

  test('compareToken > return true on successful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce(token.secretKey)
    timingSafeEqualMock.mockReturnValueOnce(true)

    const result = await token.compareToken('abc')

    expect(result).toBe(true)
  })

  test('compareToken > return true on successful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce(token.secretKey)
    timingSafeEqualMock.mockReturnValueOnce(true)

    const result = await token.compareToken('abc')

    expect(result).toBe(true)
  })

  test('compareToken > return true on successful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce(token.secretKey)
    timingSafeEqualMock.mockReturnValueOnce(true)

    const result = await token.compareToken('abc')

    expect(result).toBe(true)
  })

  test('compareToken > return false on unsuccessful sha256 comparison', async () => {
    const token = new TokenModel()
    token.secretKey = 'secret'
    token.hashMethod = HashType.SHA256
    sha256Mocks.digest.mockReturnValueOnce('wrong value')
    timingSafeEqualMock.mockReturnValueOnce(false)

    const result = await token.compareToken('abc')

    expect(result).toBe(false)
  })
})
