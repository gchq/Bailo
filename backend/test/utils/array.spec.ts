import { describe, expect, test } from 'vitest'

import { asyncFilter, dedupeByKey, findDuplicates } from '../../src/utils/array.js'

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

  test('dedupeByKey', () => {
    expect(dedupeByKey([1, 2, 3, 4])).toStrictEqual([1, 2, 3, 4])
    expect(dedupeByKey([1, 1, 2, 3])).toStrictEqual([1, 2, 3])
    expect(dedupeByKey([])).toStrictEqual([])
    expect(dedupeByKey([1, 1, 1])).toStrictEqual([1])
    expect(dedupeByKey([1, 2, 1])).toStrictEqual([1, 2])

    expect(dedupeByKey([{ a: 1 }, { a: 2 }, { a: 1 }, { a: 3 }], (i) => i.a)).toStrictEqual([
      { a: 1 },
      { a: 2 },
      { a: 3 },
    ])
    const o1 = { a: 1 }
    const o2 = { a: 1 }
    expect(dedupeByKey([o1, o2, o1])).toStrictEqual([o1, o2])
    expect(
      dedupeByKey(
        [
          { id: 'a', v: 1 },
          { id: 'b', v: 2 },
          { id: 'a', v: 3 },
        ],
        (i) => i.id,
      ),
    ).toStrictEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ])
    expect(dedupeByKey(['aa', 'b', 'cc', 'd'], (s) => s.length)).toStrictEqual(['aa', 'b'])
  })
})
