import { describe, expect, test } from 'vitest'

import { asyncFilter, dedupe, findDuplicates } from '../../src/utils/array.js'

describe('utils > array', () => {
  test('asyncFilter', async () => {
    expect(await asyncFilter([0, 1, 2], async (v) => v % 2 === 0)).toStrictEqual([0, 2])
    expect(await asyncFilter([], async (v) => v % 2 === 0)).toStrictEqual([])
  })

  test('findDuplicates', () => {
    expect(findDuplicates([1, 2, 3, 4])).toStrictEqual([])
    expect(findDuplicates([1, 1, 2, 3])).toStrictEqual([1])
    expect(findDuplicates([])).toStrictEqual([])
    expect(findDuplicates([1, 1, 1])).toStrictEqual([1, 1])
  })

  test('dedupe', () => {
    expect(dedupe([1, 2, 3, 4])).toStrictEqual([1, 2, 3, 4])
    expect(dedupe([1, 1, 2, 3])).toStrictEqual([1, 2, 3])
    expect(dedupe([])).toStrictEqual([])
    expect(dedupe([1, 1, 1])).toStrictEqual([1])
    expect(dedupe([1, 2, 1])).toStrictEqual([1, 2])
  })
})
