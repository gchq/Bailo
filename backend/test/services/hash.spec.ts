import { describe, expect, test } from 'vitest'

import {
  createArgon2Hash,
  createBcryptHash,
  createSHA256Hash,
  fromSecretKey,
  toSecretKey,
  verifyArgon2Hash,
  verifyBcryptHash,
  verifySHA256Hash,
} from '../../src/services/hash.js'

describe('services > hash > argon2', () => {
  test('verifies a correct key', () => {
    const key = 'secret-token'
    const { salt, hash } = createArgon2Hash(key)
    const stored = toSecretKey(salt, hash)

    expect(verifyArgon2Hash(key, stored)).toBe(true)
  })

  test('rejects an incorrect key', () => {
    const key = 'secret-token'
    const { salt, hash } = createArgon2Hash(key)
    const stored = toSecretKey(salt, hash)

    expect(verifyArgon2Hash('wrong-token', stored)).toBe(false)
  })
})

describe('services > hash > bcrypt', () => {
  test('verifies correct key', async () => {
    const key = 'secret-token'
    const hash = createBcryptHash(key)

    await expect(verifyBcryptHash(key, hash)).resolves.toBe(true)
  })

  test('rejects incorrect key', async () => {
    const key = 'secret-token'
    const hash = createBcryptHash(key)

    await expect(verifyBcryptHash('wrong', hash)).resolves.toBe(false)
  })
})

describe('services > hash > sha256', () => {
  test('verifies correct key', () => {
    const key = 'secret-token'
    const hash = createSHA256Hash(key)

    expect(verifySHA256Hash(key, hash)).toBe(true)
  })

  test('rejects incorrect key', () => {
    const key = 'secret-token'
    const hash = createSHA256Hash(key)

    expect(verifySHA256Hash('wrong', hash)).toBe(false)
  })
})

describe('secret key helpers', () => {
  test('round trips salt and hash', () => {
    const { salt, hash } = createArgon2Hash('abc')
    const stored = toSecretKey(salt, hash)

    const parsed = fromSecretKey(stored)

    expect(parsed.salt.equals(salt)).toBe(true)
    expect(parsed.hash.equals(hash)).toBe(true)
  })
})
