import { describe, expect, test } from 'vitest'

import { formatBytes, parseBytes } from '../../src/utils/bytes.js'

describe('utils > bytes', () => {
  test.each([
    [0, '0B'],
    [999, '999B'],
    [1000, '1kB'],
    [1500, '1.5kB'],
    [123456789, '123.46MB'],
    [-1, '-1B'],
    [-1500, '-1.5kB'],
    [-0, '0B'],
    [0.5, '0.5B'],
    [0.001, '0B'],
    [999.995, '1kB'],
    [999999.5, '1MB'],
    [1e18, '1000PB'],
    [Number.MAX_SAFE_INTEGER, '9.01PB'],
  ])('formatBytes(%s) -> %s', (input, expected) => {
    expect(formatBytes(input)).toBe(expected)
  })

  test.each([Infinity, -Infinity, NaN])('formatBytes(%s) returns null', (input) => {
    expect(formatBytes(input)).toBeNull()
  })

  test.each([
    ['0B', 0],
    ['1B', 1],
    ['1kB', 1000],
    ['1KB', 1000],
    ['1gb', 1000 ** 3],
    ['1234.232GB', 1234232000000],
    ['1.005kB', 1005],
    ['0.1kB', 100],
    ['1.5GiB', 1610612736],
    ['1GIB', 1024 ** 3],
    ['0.5KiB', 512],
    // Fractions of a byte are rounded down
    ['0.5B', 0],
    ['1.9B', 1],
    ['1.0005kB', 1000],
    ['0.1KiB', 102],
  ])('parseBytes(%j) -> %s', (input, expected) => {
    expect(parseBytes(input)).toBe(expected)
  })

  test.each([
    // Malformed
    '',
    ' ',
    'invalid',
    '10',
    '1.5',
    '10M',
    '10abc',
    '1GBB',
    'GB',
    // Scientific and hex notation
    '1e3B',
    '1E3kB',
    '1.5e3kB',
    '1e-3MB',
    '0x10B',
    '0x1GB',
    '0xFFkB',
    '-1kB',
    '+1kB',
    '-0GB',
    '.5GB',
    '1.GB',
    '00012GB',
    '01GB',
    '1.2.3GB',
    '1,5GB',
    '1_000B',
    ' 1GB',
    '1GB ',
    '1GB\n',
    '1 GB',
    'Infinity',
    'NaN',
    '1\u0663GB',
    '\uff11GB',
    // Oversized inputs
    `${'9'.repeat(31)}B`,
    `1.${'0'.repeat(31)}B`,
  ])('parseBytes(%j) returns null', (input) => {
    expect(parseBytes(input)).toBeNull()
  })

  test('parseBytes handles number and bigint input', () => {
    expect(parseBytes(0)).toBe(0)
    expect(parseBytes(1024)).toBe(1024)
    expect(parseBytes(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER)
    expect(parseBytes(1.5)).toBeNull()
    expect(parseBytes(-1)).toBeNull()
    expect(Object.is(parseBytes(-0), -0)).toBe(true)
    expect(parseBytes(Number.MAX_SAFE_INTEGER + 1)).toBeNull()
    expect(parseBytes(Infinity)).toBeNull()
    expect(parseBytes(NaN)).toBeNull()
  })
})
