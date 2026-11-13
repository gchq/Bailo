import { toSafePathId } from 'utils/stringUtils'
import { describe, expect, it } from 'vitest'

describe('toSafePathId', () => {
  it('returns the same string for valid alphanumeric and hyphen IDs', () => {
    expect(toSafePathId('abc123')).toBe('abc123')
    expect(toSafePathId('ABC-123')).toBe('ABC-123')
    expect(toSafePathId('0-9-AaZz')).toBe('0-9-AaZz')
  })

  it('encodes the value using encodeURIComponent (sanity check for valid characters)', () => {
    // Although the function restricts input to [A-Za-z0-9-], ensure encodeURIComponent is applied
    // which should keep allowed characters unchanged and not introduce encoding
    expect(toSafePathId('simple-Id-123')).toBe('simple-Id-123')
  })

  it('throws an error for IDs containing spaces', () => {
    expect(() => toSafePathId('bad id')).toThrow('Invalid ID')
  })

  it('throws an error for IDs containing underscores or other disallowed characters', () => {
    expect(() => toSafePathId('bad_id')).toThrow('Invalid ID')
    expect(() => toSafePathId('bad.id')).toThrow('Invalid ID')
    expect(() => toSafePathId('bad/id')).toThrow('Invalid ID')
    expect(() => toSafePathId('bad:id')).toThrow('Invalid ID')
    expect(() => toSafePathId('bad*id')).toThrow('Invalid ID')
    expect(() => toSafePathId('bad@id')).toThrow('Invalid ID')
  })

  it('throws an error for empty string', () => {
    expect(() => toSafePathId('')).toThrow('Invalid ID')
  })
})
