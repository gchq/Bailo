import { describe, expect, test } from 'vitest'

import { asyncFilter } from '../../src/utils/v2/array.js'

describe('utils > array', () => {
  test('asyncFilter', async () => {
    expect(await asyncFilter([0, 1, 2], async (v) => v % 2 === 0)).toStrictEqual([0, 2])
    expect(await asyncFilter([], async (v) => v % 2 === 0)).toStrictEqual([])
  })
})
