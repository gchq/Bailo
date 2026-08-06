import { describe, expect, test } from 'vitest'

import {
  createArgon2Hash,
  createBcryptHash,
  createSHA256Hash,
  verifyArgon2Hash,
  verifyBcryptHash,
  verifySHA256Hash,
} from '../../src/services/hash.js'

describe('services > hash > argon2', () => {
  test('verifies a correct key', async () => {
    const key = 'secret-token'
    const stored = await createArgon2Hash(key)
    expect(await verifyArgon2Hash(key, stored)).toBe(true)
  })

  test('rejects an incorrect key', async () => {
    const key = 'secret-token'
    const stored = await createArgon2Hash(key)
    expect(await verifyArgon2Hash('wrong-token', stored)).toBe(false)
  })
  test('throws if stored hash is missing the salt segment', async () => {
    // No ":" means split produces one element; saltHex gets the full string and hashHex is undefined.
    await expect(verifyArgon2Hash('secret-token', 'onlyhashnosalt')).rejects.toThrow(
      'Invalid stored hash: hash segment is missing or empty',
    )
  })

  test('throws if stored hash is missing the hash segment', async () => {
    // Trailing ":" means split produces an empty string for hashHex
    await expect(verifyArgon2Hash('secret-token', 'abc123:')).rejects.toThrow(
      'Invalid stored hash: hash segment is missing or empty',
    )
  })
})

describe('services > hash > bcrypt', () => {
  test('verifies correct key', async () => {
    const key = 'secret-token'
    const hash = await createBcryptHash(key)

    await expect(verifyBcryptHash(key, hash)).resolves.toBe(true)
  })

  test('rejects incorrect key', async () => {
    const key = 'secret-token'
    const hash = await createBcryptHash(key)

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
