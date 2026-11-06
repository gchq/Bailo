import bcrypt from 'bcryptjs'
import { argon2, createHash, randomBytes, timingSafeEqual } from 'crypto'

export const HashType = {
  ARGON2: 'argon2',
  Bcrypt: 'bcrypt',
  SHA256: 'sha-256',
}
export type HashTypeKeys = (typeof HashType)[keyof typeof HashType]

const ARGON2_CONFIG = {
  parallelism: 1,
  tagLength: 64,
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
export async function createArgon2Hash(key: string, salt?: Buffer) {
  const nonce = salt ?? randomBytes(16)

  const hash = await new Promise<Buffer>((resolve, reject) => {
    argon2('argon2id', { message: Buffer.from(key), nonce, ...ARGON2_CONFIG }, (err, derivedKey) => {
      if (err) {
        reject(new Error('Error when creating Argon2 hash', { cause: err }))
      } else {
        resolve(derivedKey)
      }
    })
  })

  return `${nonce.toString('hex')}:${hash.toString('hex')}`
}

/**
 * Verifies a key against a stored Argon2 hash formatted as "salt:hash".
 * Recomputes the hash using the extracted salt and compares using a timing-safe check.
 */
export async function verifyArgon2Hash(key: string, stored: string) {
  const [saltHex, hashHex] = stored.split(':')

  if (typeof saltHex !== 'string' || saltHex.length === 0) {
    throw new Error('Invalid stored hash: salt segment is missing or empty')
  }

  if (typeof hashHex !== 'string' || hashHex.length === 0) {
    throw new Error('Invalid stored hash: hash segment is missing or empty')
  }

  const salt = Buffer.from(saltHex, 'hex')
  const expectedHash = Buffer.from(hashHex, 'hex')

  const recomputed = await createArgon2Hash(key, salt)
  const recomputedHash = Buffer.from(recomputed.split(':')[1], 'hex')

  if (recomputedHash.length !== expectedHash.length) {
    return false
  }

  return timingSafeEqual(recomputedHash, expectedHash)
}

/**
 * Creates a bcrypt hash for the provided key using the configured cost factor.
 * Throws if the hashing fails.
 */
export async function createBcryptHash(key: string): Promise<string> {
  return await bcrypt.hash(key, BCRYPT_CONFIG.rounds)
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
