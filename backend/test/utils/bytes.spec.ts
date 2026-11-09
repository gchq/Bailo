import { describe, expect, test } from 'vitest'

import { formatBytes, parseBytes } from '../../src/utils/bytes.js'

describe('utils > bytes', () => {
  test('formatBytes formats binary byte units', () => {
    expect(formatBytes(0)).toBe('0B')
    expect(formatBytes(1023)).toBe('1023B')
    expect(formatBytes(1024)).toBe('1KB')
    expect(formatBytes(123456789)).toBe('117.74MB')
    expect(formatBytes(-1)).toBe('-1B')
    expect(formatBytes(Infinity)).toBeNull()
  })

  test('parseBytes parses the configured ClamAV size', () => {
    expect(parseBytes('10M')).toBe(10)
    expect(parseBytes('10MB')).toBe(10 * 1024 ** 2)
    expect(parseBytes('1.5GB')).toBe(Math.floor(1.5 * 1024 ** 3))
    expect(parseBytes('invalid')).toBeNull()
  })
})
