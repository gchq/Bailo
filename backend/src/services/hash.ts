import bcrypt from 'bcryptjs'
import { argon2Sync, createHash, randomBytes, timingSafeEqual } from 'crypto'

import { BadReq } from '../utils/error.js'

export const HashType = {
  argon2: 'argon2',
  Bcrypt: 'bcrypt',
  SHA256: 'sha-256',
}
export type HashTypeKeys = (typeof HashType)[keyof typeof HashType]

const ARGON2_CONFIG = {
  parallelism: 1,
  tagLength: 32,
  memory: 64 * 1024, // 64 MB
  passes: 3,
}

const BCRYPT_CONFIG = {
  rounds: 8,
}

/**
 * Generates an Argon2id hash for the given key using a provided or random salt.
 * Returns both the salt and computed hash.
 */
export function createArgon2Hash(key: string, salt?: Buffer) {
  const nonce = salt ?? randomBytes(16)

  const hash = argon2Sync('argon2id', {
    message: Buffer.from(key),
    nonce,
    ...ARGON2_CONFIG,
  })

  return { salt: nonce, hash }
}

/**
 * Verifies a key against a stored Argon2 hash formatted as "salt:hash".
 * Recomputes the hash using the extracted salt and compares using a timing-safe check.
 */
export function verifyArgon2Hash(key: string, stored: string) {
  const [saltHex, hashHex] = stored.split(':')

  const salt = Buffer.from(saltHex, 'hex')
  const expectedHash = Buffer.from(hashHex, 'hex')

  const { hash } = createArgon2Hash(key, salt)

  if (hash.length !== expectedHash.length) {
    return false
  }

  return timingSafeEqual(hash, expectedHash)
}

/**
 * Creates a bcrypt hash for the provided key using the configured cost factor.
 * Throws if hashing fails.
 */
export function createBcryptHash(key: string): string {
  const hash = bcrypt.hashSync(key, BCRYPT_CONFIG.rounds)

  if (!hash) {
    throw BadReq('Unable to create token')
  }

  return hash
}

/**
 * Verifies a key against a stored bcrypt hash.
 * Returns a promise resolving to true if the key matches.
 */
export function verifyBcryptHash(key: string, stored: string): Promise<boolean> {
  return bcrypt.compare(key, stored)
}

/**
 * Generates a SHA-256 hash of the provided key and returns it as a hex string.
 */
export function createSHA256Hash(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Verifies a key against a stored SHA-256 hex digest using a timing-safe comparison.
 */
export function verifySHA256Hash(key: string, stored: string): boolean {
  const candidateHex = createSHA256Hash(key)

  const candidate = Buffer.from(candidateHex, 'hex')
  const expected = Buffer.from(stored, 'hex')

  if (candidate.length !== expected.length) {
    return false
  }

  return timingSafeEqual(candidate, expected)
}

/**
 * Serialises a salt and hash into a storage string formatted as "saltHex:hashHex".
 */
export function toSecretKey(salt: Buffer, hash: Buffer): string {
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

/**
 * Deserialises a stored "saltHex:hashHex" string into salt and hash buffers.
 */
export function fromSecretKey(stored: string): { salt: Buffer; hash: Buffer } {
  const [saltHex, hashHex] = stored.split(':')
  return {
    salt: Buffer.from(saltHex, 'hex'),
    hash: Buffer.from(hashHex, 'hex'),
  }
}
